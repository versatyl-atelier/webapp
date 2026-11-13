import { spawn } from "node:child_process";
import { once } from "node:events";
import { existsSync, readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";

import { hashPassword } from "better-auth/crypto";
import { parse } from "dotenv";
import { Client, escapeIdentifier, type ClientConfig } from "pg";

const ENVIRONMENTS = {
  dev: {
    envFile: ".env",
    local: true,
    deployCommand: "npm run db:deploy",
    confirm: false,
  },
  staging: {
    envFile: ".env.staging",
    local: false,
    deployCommand: "npm run db:deploy:staging",
    confirm: false,
  },
  prod: {
    envFile: ".env.prod",
    local: false,
    deployCommand: "npm run db:deploy:prod",
    confirm: true,
  },
} as const;

const DATABASE_URL_VARIABLE = "DATABASE_URL_UNPOOLED";
const FALLBACK_PASSWORD_VARIABLE = "CREATE_USERS_PASSWORD";
const DEFAULT_PORT = 5432;
const DEFAULT_REMOTE_SSL_MODE = "require";
const LOCAL_HOSTNAMES = ["localhost", "127.0.0.1", "[::1]"];
const LOCAL_HOSTNAME_SUFFIX = ".localtest.me";
const READ_ONLY_OPTIONS = "-c default_transaction_read_only=on";
const READ_ONLY_ON = "on";
const SERVER_VERSION_NUM_DIVISOR = 10000;
const POSTGRES_IMAGE_PREFIX = "postgres:";
const POSTGRES_IMAGE_SUFFIX = "-alpine";
const COMPOSE_SERVICE = "postgres";
const SCHEMA = "public";
const ACCOUNTS_TABLE = "accounts";
const TARGET_OWNED_TABLES = ["trelloWebhooks"];
const TABLES_WITHOUT_DATA = [
  "sessions",
  "verifications",
  ACCOUNTS_TABLE,
  ...TARGET_OWNED_TABLES,
];
const WITH_PASSWORDS_OPTION = "with-passwords";
const PASSWORD_COLUMN = "password";
const ACCOUNT_SECRET_COLUMNS = [
  PASSWORD_COLUMN,
  "accessToken",
  "refreshToken",
  "idToken",
];
const KEPT_TABLE_PREFIX = "kept_";
const CREDENTIAL_PROVIDER_ID = "credential";
const FALLBACK_HASH_VARIABLE = "fallback_password_hash";
const COPY_NULL = "\\N";
const COPY_END = "\\.";
const COPY_SPECIAL_CHARACTERS = /[\\\t\n\r]/g;
const COPY_ESCAPES: Record<string, string> = {
  "\\": "\\\\",
  "\t": "\\t",
  "\n": "\\n",
  "\r": "\\r",
};

const MIGRATIONS_TABLE_EXISTS_QUERY = `SELECT to_regclass('${SCHEMA}._prisma_migrations') IS NOT NULL AS "exists"`;
const MIGRATIONS_QUERY = `
  SELECT migration_name AS name, checksum, finished_at IS NOT NULL AS finished
  FROM ${SCHEMA}._prisma_migrations
  WHERE rolled_back_at IS NULL
  ORDER BY migration_name`;
const ACCOUNT_COLUMNS_QUERY = `
  SELECT column_name FROM information_schema.columns
  WHERE table_schema = $1 AND table_name = $2
  ORDER BY ordinal_position`;

const keptTable = (table: string) =>
  `pg_temp.${escapeIdentifier(`${KEPT_TABLE_PREFIX}${table}`)}`;
const schemaTable = (table: string) => `${SCHEMA}.${escapeIdentifier(table)}`;

const PREAMBLE = `
SET client_min_messages = warning;
BEGIN;
CREATE TEMP TABLE target_passwords AS
  SELECT users.email, accounts.password
  FROM ${SCHEMA}.accounts JOIN ${SCHEMA}.users ON users.id = accounts."userId"
  WHERE accounts."providerId" = '${CREDENTIAL_PROVIDER_ID}' AND accounts.password IS NOT NULL;
${TARGET_OWNED_TABLES.map(
  (table) =>
    `CREATE TEMP TABLE ${keptTable(table)} AS TABLE ${schemaTable(table)};`,
).join("\n")}
DROP SCHEMA ${SCHEMA} CASCADE;
`;

const TARGET_OWNED_SQL = TARGET_OWNED_TABLES.map(
  (table) =>
    `INSERT INTO ${schemaTable(table)} SELECT * FROM ${keptTable(table)};`,
).join("\n");

const KEEP_TARGET_PASSWORDS_SQL = `
UPDATE ${SCHEMA}.accounts SET password = target_passwords.password
  FROM ${SCHEMA}.users, pg_temp.target_passwords
  WHERE accounts."userId" = users.id
    AND users.email = target_passwords.email
    AND accounts."providerId" = '${CREDENTIAL_PROVIDER_ID}';
`;

const FALLBACK_PASSWORDS_SQL = `
UPDATE ${SCHEMA}.accounts SET password = :'${FALLBACK_HASH_VARIABLE}'
  WHERE "providerId" = '${CREDENTIAL_PROVIDER_ID}' AND password IS NULL;
COMMIT;
`;

const SUMMARY_QUERY = `
  SELECT
    (SELECT count(*) FROM ${SCHEMA}.users)::int AS users,
    count(*) FILTER (WHERE password <> $1)::int AS kept,
    count(*) FILTER (WHERE password = $1)::int AS fallback
  FROM ${SCHEMA}.accounts
  WHERE "providerId" = '${CREDENTIAL_PROVIDER_ID}'`;

class CopyDbError extends Error {}

type EnvironmentName = keyof typeof ENVIRONMENTS;

type Connection = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  sslMode: string | null;
  channelBinding: string | null;
  options: string | null;
};

type Database = {
  name: EnvironmentName;
  envFile: string;
  local: boolean;
  deployCommand: string;
  confirm: boolean;
  connection: Connection;
};

type Migration = { name: string; checksum: string; finished: boolean };

type ServerState = { serverMajor: number; migrations: Migration[] | null };

type SourceState = ServerState & {
  migrations: Migration[];
  accountColumns: string[];
  accountRows: (string | null)[][];
};

type PgCommand = {
  command: string;
  args: string[];
  env: NodeJS.ProcessEnv;
};

function isEnvironmentName(value: string): value is EnvironmentName {
  return Object.hasOwn(ENVIRONMENTS, value);
}

function parseArguments(args: string[]) {
  const usage = `Usage: npm run db:copy -- <source> <target> [--${WITH_PASSWORDS_OPTION}], where source and target are one of: ${Object.keys(ENVIRONMENTS).join(", ")}`;
  let parsed;
  try {
    parsed = parseArgs({
      args,
      allowPositionals: true,
      options: { [WITH_PASSWORDS_OPTION]: { type: "boolean", default: false } },
    });
  } catch {
    throw new CopyDbError(usage);
  }
  const { positionals, values } = parsed;
  const [source, target] = positionals;
  if (
    positionals.length !== 2 ||
    !source ||
    !target ||
    !isEnvironmentName(source) ||
    !isEnvironmentName(target)
  ) {
    throw new CopyDbError(usage);
  }
  if (source === target) {
    throw new CopyDbError("The source and the target must be different");
  }
  return {
    source,
    target,
    withPasswords: values[WITH_PASSWORDS_OPTION] === true,
  };
}

function isLocal(host: string) {
  return LOCAL_HOSTNAMES.includes(host) || host.endsWith(LOCAL_HOSTNAME_SUFFIX);
}

function databaseFrom(name: EnvironmentName): Database {
  const environment = ENVIRONMENTS[name];
  const { envFile } = environment;
  if (!existsSync(envFile)) {
    throw new CopyDbError(`${envFile} is missing, see README.md`);
  }
  const value = parse(readFileSync(envFile))[DATABASE_URL_VARIABLE];
  if (!value) {
    throw new CopyDbError(
      `The ${DATABASE_URL_VARIABLE} environment variable must have a non-empty value in ${envFile}`,
    );
  }
  const url = new URL(value);
  const connection = {
    host: url.hostname,
    port: url.port ? Number(url.port) : DEFAULT_PORT,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    sslMode: url.searchParams.get("sslmode"),
    channelBinding: url.searchParams.get("channel_binding"),
    options: url.searchParams.get("options"),
  };
  if (environment.local && !isLocal(connection.host)) {
    throw new CopyDbError(
      `Refusing to use ${connection.host}: the ${name} database in ${envFile} must be local (${LOCAL_HOSTNAMES.join(", ")} or *${LOCAL_HOSTNAME_SUFFIX})`,
    );
  }
  if (!environment.local && isLocal(connection.host)) {
    throw new CopyDbError(
      `${envFile} points to a local database (${connection.host}), it should point to ${name}`,
    );
  }
  return { name, ...environment, connection };
}

function readOnlyOptions(connection: Connection) {
  return [connection.options, READ_ONLY_OPTIONS].filter(Boolean).join(" ");
}

function clientConfig(
  { local, connection }: Database,
  readOnly: boolean,
): ClientConfig {
  const options = readOnly ? readOnlyOptions(connection) : connection.options;
  return {
    host: connection.host,
    port: connection.port,
    user: connection.user,
    password: connection.password,
    database: connection.database,
    ...(local ? {} : { ssl: true }),
    ...(options ? { options } : {}),
  };
}

function remotePgEnv(connection: Connection, readOnly: boolean) {
  const options = readOnly ? readOnlyOptions(connection) : connection.options;
  return {
    PGHOST: connection.host,
    PGPORT: String(connection.port),
    PGUSER: connection.user,
    PGPASSWORD: connection.password,
    PGDATABASE: connection.database,
    PGSSLMODE: connection.sslMode ?? DEFAULT_REMOTE_SSL_MODE,
    ...(connection.channelBinding
      ? { PGCHANNELBINDING: connection.channelBinding }
      : {}),
    ...(options ? { PGOPTIONS: options } : {}),
  };
}

function pgCommand(
  database: Database,
  serverMajor: number,
  readOnly: boolean,
  tool: string,
  toolArgs: string[],
): PgCommand {
  const { connection } = database;
  if (database.local) {
    return {
      command: "docker",
      args: [
        "compose",
        "exec",
        "-T",
        ...(readOnly
          ? ["--env", `PGOPTIONS=${readOnlyOptions(connection)}`]
          : []),
        COMPOSE_SERVICE,
        tool,
        `--username=${connection.user}`,
        `--dbname=${connection.database}`,
        ...toolArgs,
      ],
      env: process.env,
    };
  }
  const pgEnv = remotePgEnv(connection, readOnly);
  return {
    command: "docker",
    args: [
      "run",
      "--rm",
      "--interactive",
      ...Object.keys(pgEnv).flatMap((variable) => ["--env", variable]),
      `${POSTGRES_IMAGE_PREFIX}${serverMajor}${POSTGRES_IMAGE_SUFFIX}`,
      tool,
      ...toolArgs,
    ],
    env: { ...process.env, ...pgEnv },
  };
}

async function withClient<T>(
  config: ClientConfig,
  use: (client: Client) => Promise<T>,
) {
  const client = new Client(config);
  await client.connect();
  try {
    return await use(client);
  } finally {
    await client.end();
  }
}

async function serverState(client: Client): Promise<ServerState> {
  const version = await client.query<{ server_version_num: string }>(
    "SHOW server_version_num",
  );
  const { rows } = await client.query<{ exists: boolean }>(
    MIGRATIONS_TABLE_EXISTS_QUERY,
  );
  return {
    serverMajor: Math.floor(
      Number(version.rows[0]?.server_version_num) / SERVER_VERSION_NUM_DIVISOR,
    ),
    migrations: rows[0]?.exists
      ? (await client.query<Migration>(MIGRATIONS_QUERY)).rows
      : null,
  };
}

function readSource(source: Database, withPasswords: boolean) {
  return withClient<SourceState>(clientConfig(source, true), async (client) => {
    const readOnly = await client.query<{ transaction_read_only: string }>(
      "SHOW transaction_read_only",
    );
    if (readOnly.rows[0]?.transaction_read_only !== READ_ONLY_ON) {
      throw new CopyDbError(
        `The connection to ${source.name} is not read-only, aborting before reading or writing anything`,
      );
    }
    const { serverMajor, migrations } = await serverState(client);
    if (!migrations) {
      throw new CopyDbError(
        `${source.name} has no migrations applied. Run \`${source.deployCommand}\`, then try again.`,
      );
    }
    const columns = await client.query<{ column_name: string }>(
      ACCOUNT_COLUMNS_QUERY,
      [SCHEMA, ACCOUNTS_TABLE],
    );
    const accountColumns = columns.rows
      .map(({ column_name }) => column_name)
      .filter(
        (column) =>
          !ACCOUNT_SECRET_COLUMNS.includes(column) ||
          (withPasswords && column === PASSWORD_COLUMN),
      );
    const selectList = accountColumns
      .map((column) => `${escapeIdentifier(column)}::text`)
      .join(", ");
    const accounts = await client.query<(string | null)[]>({
      text: `SELECT ${selectList} FROM ${SCHEMA}.${ACCOUNTS_TABLE}`,
      rowMode: "array",
    });
    return {
      serverMajor,
      migrations,
      accountColumns,
      accountRows: accounts.rows,
    };
  });
}

function bulletList(migrations: Migration[]) {
  return migrations.map(({ name }) => `  - ${name}`).join("\n");
}

function migrationProblems(
  source: Database,
  target: Database,
  sourceMigrations: Migration[],
  targetMigrations: Migration[] | null,
) {
  if (!targetMigrations) {
    return [
      `${target.name} has no migrations applied. Run \`${target.deployCommand}\`, then try again.`,
    ];
  }
  const targetByName = new Map(
    targetMigrations.map((migration) => [migration.name, migration]),
  );
  const sourceNames = new Set(sourceMigrations.map(({ name }) => name));
  const onlySource = sourceMigrations.filter(
    ({ name }) => !targetByName.has(name),
  );
  const onlyTarget = targetMigrations.filter(
    ({ name }) => !sourceNames.has(name),
  );
  const changed = sourceMigrations.filter(({ name, checksum }) => {
    const targetMigration = targetByName.get(name);
    return targetMigration && targetMigration.checksum !== checksum;
  });
  const unfinishedSource = sourceMigrations.filter(({ finished }) => !finished);
  const unfinishedTarget = targetMigrations.filter(({ finished }) => !finished);
  return [
    onlySource.length &&
      `${source.name} has migrations ${target.name} doesn't:\n${bulletList(onlySource)}\nMake sure your code contains them and run \`${target.deployCommand}\`, then try again.`,
    onlyTarget.length &&
      `${target.name} has migrations ${source.name} doesn't:\n${bulletList(onlyTarget)}\nRun \`${source.deployCommand}\` (see docs/workflow.md), or bring ${target.name} back to ${source.name}'s migrations, then try again.`,
    changed.length &&
      `These migrations have different contents on ${source.name} and on ${target.name}:\n${bulletList(changed)}`,
    unfinishedSource.length &&
      `${source.name} has failed or unfinished migrations:\n${bulletList(unfinishedSource)}`,
    unfinishedTarget.length &&
      `${target.name} has failed or unfinished migrations:\n${bulletList(unfinishedTarget)}`,
  ].filter((problem): problem is string => Boolean(problem));
}

function escapeCopyValue(value: string | null) {
  return value === null
    ? COPY_NULL
    : value.replace(
        COPY_SPECIAL_CHARACTERS,
        (character) => COPY_ESCAPES[character] ?? character,
      );
}

function accountsSql({ accountColumns, accountRows }: SourceState) {
  const columnList = accountColumns.map(escapeIdentifier).join(", ");
  const rows = accountRows
    .map((row) => `${row.map(escapeCopyValue).join("\t")}\n`)
    .join("");
  return `
CREATE TEMP TABLE source_accounts (LIKE ${SCHEMA}.${ACCOUNTS_TABLE});
COPY pg_temp.source_accounts (${columnList}) FROM stdin;
${rows}${COPY_END}
INSERT INTO ${SCHEMA}.${ACCOUNTS_TABLE} (${columnList})
  SELECT ${columnList} FROM pg_temp.source_accounts
  WHERE "userId" IN (SELECT id FROM ${SCHEMA}.users);
`;
}

async function confirmTarget(target: Database) {
  if (!target.confirm) {
    return;
  }
  if (!process.stdin.isTTY) {
    throw new CopyDbError(
      `Overwriting ${target.name} must be confirmed interactively. Nothing was changed.`,
    );
  }
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    const answer = await readline.question(
      `⚠️  This replaces all data in ${target.name} (${target.connection.host}). Type "${target.name}" to continue: `,
    );
    if (answer.trim() !== target.name) {
      throw new CopyDbError("Not confirmed. Nothing was changed.");
    }
  } finally {
    readline.close();
  }
}

async function copy(
  source: Database,
  target: Database,
  sourceState: SourceState,
  targetServerMajor: number,
  fallbackHash: string,
  withPasswords: boolean,
) {
  const write = pgCommand(target, targetServerMajor, false, "psql", [
    "--quiet",
    "--no-psqlrc",
    "--output=/dev/null",
    "--set=ON_ERROR_STOP=1",
    `--set=${FALLBACK_HASH_VARIABLE}=${fallbackHash}`,
  ]);
  const psql = spawn(write.command, write.args, {
    env: write.env,
    stdio: ["pipe", "inherit", "inherit"],
  });
  psql.stdin.on("error", () => {});
  const psqlExit = once(psql, "close");
  psql.stdin.write(PREAMBLE);

  const read = pgCommand(source, sourceState.serverMajor, true, "pg_dump", [
    `--schema=${SCHEMA}`,
    "--no-owner",
    "--no-privileges",
    ...TABLES_WITHOUT_DATA.map(
      (table) => `--exclude-table-data=${schemaTable(table)}`,
    ),
  ]);
  const dump = spawn(read.command, read.args, {
    env: read.env,
    stdio: ["ignore", "pipe", "inherit"],
  });
  const dumpExit = once(dump, "close");
  dump.stdout.pipe(psql.stdin, { end: false });
  psqlExit.then(() => dump.kill());

  const [dumpCode] = await dumpExit;
  if (dumpCode === 0) {
    psql.stdin.write(accountsSql(sourceState));
    psql.stdin.write(TARGET_OWNED_SQL);
    if (!withPasswords) {
      psql.stdin.write(KEEP_TARGET_PASSWORDS_SQL);
    }
    psql.stdin.write(FALLBACK_PASSWORDS_SQL);
  }
  psql.stdin.end();
  const [psqlCode] = await psqlExit;

  if (dumpCode !== 0) {
    throw new CopyDbError(
      `Reading ${source.name} failed (see pg_dump output above). ${target.name} was left untouched.`,
    );
  }
  if (psqlCode !== 0) {
    throw new CopyDbError(
      `Writing to ${target.name} failed (see psql output above). It was left untouched.`,
    );
  }
}

async function copyDb() {
  const { withPasswords, ...names } = parseArguments(process.argv.slice(2));
  const source = databaseFrom(names.source);
  const target = databaseFrom(names.target);

  const fallbackPassword = parse(readFileSync(target.envFile))[
    FALLBACK_PASSWORD_VARIABLE
  ];
  if (!fallbackPassword) {
    throw new CopyDbError(
      `The ${FALLBACK_PASSWORD_VARIABLE} environment variable must have a non-empty value in ${target.envFile}, it becomes the password of ${source.name} users who have no password in ${target.name}`,
    );
  }

  console.log(`Reading ${source.name} (read-only)…`);
  const sourceState = await readSource(source, withPasswords);
  const targetState = await withClient(
    clientConfig(target, false),
    serverState,
  );
  const problems = migrationProblems(
    source,
    target,
    sourceState.migrations,
    targetState.migrations,
  );
  if (problems.length) {
    throw new CopyDbError(
      `${source.name} and ${target.name} are not on the same migrations. Nothing was changed.\n\n${problems.join("\n\n")}`,
    );
  }

  await confirmTarget(target);

  const fallbackHash = await hashPassword(fallbackPassword);
  console.log(`Replacing ${target.name} with a copy of ${source.name}…`);
  await copy(
    source,
    target,
    sourceState,
    targetState.serverMajor,
    fallbackHash,
    withPasswords,
  );

  const summary = await withClient(
    clientConfig(target, false),
    async (client) => {
      const { rows } = await client.query<{
        users: number;
        kept: number;
        fallback: number;
      }>(SUMMARY_QUERY, [fallbackHash]);
      return rows[0];
    },
  );
  console.log(
    `Done. ${target.name} is now a copy of ${source.name} with ${summary?.users} users: ${summary?.kept} ${withPasswords ? `got their ${source.name} password` : `kept their ${target.name} password`}, ${summary?.fallback} got ${FALLBACK_PASSWORD_VARIABLE} from ${target.envFile}. Sessions and verification tokens were not copied, and ${target.name} kept its own ${TARGET_OWNED_TABLES.join(", ")}.`,
  );
}

copyDb().catch((error) => {
  console.error(error instanceof CopyDbError ? `✋ ${error.message}` : error);
  process.exitCode = 1;
});
