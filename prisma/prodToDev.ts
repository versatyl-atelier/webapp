import { spawn } from "node:child_process";
import { once } from "node:events";
import { existsSync, readFileSync } from "node:fs";

import { hashPassword } from "better-auth/crypto";
import { parse } from "dotenv";
import { Client, escapeIdentifier, type ClientConfig } from "pg";

const DEV_ENV_FILE = ".env";
const PROD_ENV_FILE = ".env.prod";
const DATABASE_URL_VARIABLE = "DATABASE_URL_UNPOOLED";
const FALLBACK_PASSWORD_VARIABLE = "CREATE_USERS_PASSWORD";
const DEFAULT_PORT = 5432;
const DEFAULT_PROD_SSL_MODE = "require";
const LOCAL_HOSTNAMES = ["localhost", "127.0.0.1", "[::1]"];
const LOCAL_HOSTNAME_SUFFIX = ".localtest.me";
const READ_ONLY_OPTIONS = "-c default_transaction_read_only=on";
const READ_ONLY_ON = "on";
const SERVER_VERSION_NUM_DIVISOR = 10000;
const DUMP_IMAGE_PREFIX = "postgres:";
const DUMP_IMAGE_SUFFIX = "-alpine";
const COMPOSE_SERVICE = "postgres";
const SCHEMA = "public";
const ACCOUNTS_TABLE = "accounts";
const TABLES_WITHOUT_DATA = ["sessions", "verifications", ACCOUNTS_TABLE];
const ACCOUNT_SECRET_COLUMNS = [
  "password",
  "accessToken",
  "refreshToken",
  "idToken",
];
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
const PG_ENV_VARIABLES = [
  "PGHOST",
  "PGPORT",
  "PGUSER",
  "PGPASSWORD",
  "PGDATABASE",
  "PGSSLMODE",
  "PGCHANNELBINDING",
  "PGOPTIONS",
];

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

const PREAMBLE = `
SET client_min_messages = warning;
BEGIN;
CREATE TEMP TABLE dev_passwords AS
  SELECT users.email, accounts.password
  FROM ${SCHEMA}.accounts JOIN ${SCHEMA}.users ON users.id = accounts."userId"
  WHERE accounts."providerId" = '${CREDENTIAL_PROVIDER_ID}' AND accounts.password IS NOT NULL;
DROP SCHEMA ${SCHEMA} CASCADE;
`;

const PASSWORDS_SQL = `
UPDATE ${SCHEMA}.accounts SET password = dev_passwords.password
  FROM ${SCHEMA}.users, pg_temp.dev_passwords
  WHERE accounts."userId" = users.id
    AND users.email = dev_passwords.email
    AND accounts."providerId" = '${CREDENTIAL_PROVIDER_ID}';
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

class ProdToDevError extends Error {}

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

type Migration = { name: string; checksum: string; finished: boolean };

type ProdState = {
  serverMajor: number;
  migrations: Migration[];
  accountColumns: string[];
  accountRows: (string | null)[][];
};

function connectionFrom(envFile: string): Connection {
  if (!existsSync(envFile)) {
    throw new ProdToDevError(`${envFile} is missing, see README.md`);
  }
  const value = parse(readFileSync(envFile))[DATABASE_URL_VARIABLE];
  if (!value) {
    throw new ProdToDevError(
      `The ${DATABASE_URL_VARIABLE} environment variable must have a non-empty value in ${envFile}`,
    );
  }
  const url = new URL(value);
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : DEFAULT_PORT,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    sslMode: url.searchParams.get("sslmode"),
    channelBinding: url.searchParams.get("channel_binding"),
    options: url.searchParams.get("options"),
  };
}

function isLocal(host: string) {
  return LOCAL_HOSTNAMES.includes(host) || host.endsWith(LOCAL_HOSTNAME_SUFFIX);
}

function assertSafeTargets(prod: Connection, dev: Connection) {
  if (!isLocal(dev.host)) {
    throw new ProdToDevError(
      `Refusing to overwrite ${dev.host}: the dev database in ${DEV_ENV_FILE} must be local (${LOCAL_HOSTNAMES.join(", ")} or *${LOCAL_HOSTNAME_SUFFIX})`,
    );
  }
  if (isLocal(prod.host)) {
    throw new ProdToDevError(
      `${PROD_ENV_FILE} points to a local database (${prod.host}), it should point to prod`,
    );
  }
}

function readOnlyOptions(connection: Connection) {
  return [connection.options, READ_ONLY_OPTIONS].filter(Boolean).join(" ");
}

function prodClientConfig(prod: Connection): ClientConfig {
  return {
    host: prod.host,
    port: prod.port,
    user: prod.user,
    password: prod.password,
    database: prod.database,
    ssl: true,
    options: readOnlyOptions(prod),
  };
}

function devClientConfig(dev: Connection): ClientConfig {
  return {
    host: dev.host,
    port: dev.port,
    user: dev.user,
    password: dev.password,
    database: dev.database,
  };
}

function prodPgEnv(prod: Connection) {
  return {
    PGHOST: prod.host,
    PGPORT: String(prod.port),
    PGUSER: prod.user,
    PGPASSWORD: prod.password,
    PGDATABASE: prod.database,
    PGSSLMODE: prod.sslMode ?? DEFAULT_PROD_SSL_MODE,
    ...(prod.channelBinding ? { PGCHANNELBINDING: prod.channelBinding } : {}),
    PGOPTIONS: readOnlyOptions(prod),
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

async function appliedMigrations(client: Client) {
  const { rows } = await client.query<{ exists: boolean }>(
    MIGRATIONS_TABLE_EXISTS_QUERY,
  );
  if (!rows[0]?.exists) {
    return null;
  }
  return (await client.query<Migration>(MIGRATIONS_QUERY)).rows;
}

function readProd(prod: Connection) {
  return withClient<ProdState>(prodClientConfig(prod), async (client) => {
    const readOnly = await client.query<{ transaction_read_only: string }>(
      "SHOW transaction_read_only",
    );
    if (readOnly.rows[0]?.transaction_read_only !== READ_ONLY_ON) {
      throw new ProdToDevError(
        "The connection to prod is not read-only, aborting before reading or writing anything",
      );
    }
    const version = await client.query<{ server_version_num: string }>(
      "SHOW server_version_num",
    );
    const migrations = await appliedMigrations(client);
    if (!migrations) {
      throw new ProdToDevError("Prod has no migrations applied");
    }
    const columns = await client.query<{ column_name: string }>(
      ACCOUNT_COLUMNS_QUERY,
      [SCHEMA, ACCOUNTS_TABLE],
    );
    const accountColumns = columns.rows
      .map(({ column_name }) => column_name)
      .filter((column) => !ACCOUNT_SECRET_COLUMNS.includes(column));
    const selectList = accountColumns
      .map((column) => `${escapeIdentifier(column)}::text`)
      .join(", ");
    const accounts = await client.query<(string | null)[]>({
      text: `SELECT ${selectList} FROM ${SCHEMA}.${ACCOUNTS_TABLE}`,
      rowMode: "array",
    });
    return {
      serverMajor: Math.floor(
        Number(version.rows[0]?.server_version_num) /
          SERVER_VERSION_NUM_DIVISOR,
      ),
      migrations,
      accountColumns,
      accountRows: accounts.rows,
    };
  });
}

function bulletList(migrations: Migration[]) {
  return migrations.map(({ name }) => `  - ${name}`).join("\n");
}

function migrationProblems(prod: Migration[], dev: Migration[] | null) {
  if (!dev) {
    return [
      `Your local dev DB has no migrations applied. Run \`npm run db:deploy\`, then try again.`,
    ];
  }
  const devByName = new Map(
    dev.map((migration) => [migration.name, migration]),
  );
  const prodNames = new Set(prod.map(({ name }) => name));
  const onlyProd = prod.filter(({ name }) => !devByName.has(name));
  const onlyDev = dev.filter(({ name }) => !prodNames.has(name));
  const changed = prod.filter(({ name, checksum }) => {
    const devMigration = devByName.get(name);
    return devMigration && devMigration.checksum !== checksum;
  });
  const unfinishedProd = prod.filter(({ finished }) => !finished);
  const unfinishedDev = dev.filter(({ finished }) => !finished);
  return [
    onlyProd.length &&
      `Prod has migrations your local dev DB doesn't:\n${bulletList(onlyProd)}\nPull the code that contains them and run \`npm run db:deploy\`, then try again.`,
    onlyDev.length &&
      `Your local dev DB has migrations prod doesn't:\n${bulletList(onlyDev)}\nThey must reach prod first (see docs/workflow.md), or your local dev DB must be brought back to prod's migrations.`,
    changed.length &&
      `These migrations have different contents on prod and on your local dev DB:\n${bulletList(changed)}`,
    unfinishedProd.length &&
      `Prod has failed or unfinished migrations:\n${bulletList(unfinishedProd)}`,
    unfinishedDev.length &&
      `Your local dev DB has failed or unfinished migrations:\n${bulletList(unfinishedDev)}`,
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

function accountsSql({ accountColumns, accountRows }: ProdState) {
  const columnList = accountColumns.map(escapeIdentifier).join(", ");
  const rows = accountRows
    .map((row) => `${row.map(escapeCopyValue).join("\t")}\n`)
    .join("");
  return `
CREATE TEMP TABLE prod_accounts (LIKE ${SCHEMA}.${ACCOUNTS_TABLE});
COPY pg_temp.prod_accounts (${columnList}) FROM stdin;
${rows}${COPY_END}
INSERT INTO ${SCHEMA}.${ACCOUNTS_TABLE} (${columnList})
  SELECT ${columnList} FROM pg_temp.prod_accounts
  WHERE "userId" IN (SELECT id FROM ${SCHEMA}.users);
`;
}

async function copyProdToDev(
  prod: Connection,
  dev: Connection,
  prodState: ProdState,
  fallbackHash: string,
) {
  const psql = spawn(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      COMPOSE_SERVICE,
      "psql",
      "--quiet",
      "--no-psqlrc",
      "--output=/dev/null",
      "--set=ON_ERROR_STOP=1",
      `--set=${FALLBACK_HASH_VARIABLE}=${fallbackHash}`,
      `--username=${dev.user}`,
      `--dbname=${dev.database}`,
    ],
    { stdio: ["pipe", "inherit", "inherit"] },
  );
  psql.stdin.on("error", () => {});
  const psqlExit = once(psql, "close");
  psql.stdin.write(PREAMBLE);

  const dump = spawn(
    "docker",
    [
      "run",
      "--rm",
      ...PG_ENV_VARIABLES.flatMap((variable) => ["--env", variable]),
      `${DUMP_IMAGE_PREFIX}${prodState.serverMajor}${DUMP_IMAGE_SUFFIX}`,
      "pg_dump",
      `--schema=${SCHEMA}`,
      "--no-owner",
      "--no-privileges",
      ...TABLES_WITHOUT_DATA.map(
        (table) => `--exclude-table-data=${SCHEMA}.${table}`,
      ),
    ],
    {
      env: { ...process.env, ...prodPgEnv(prod) },
      stdio: ["ignore", "pipe", "inherit"],
    },
  );
  const dumpExit = once(dump, "close");
  dump.stdout.pipe(psql.stdin, { end: false });
  psqlExit.then(() => dump.kill());

  const [dumpCode] = await dumpExit;
  if (dumpCode === 0) {
    psql.stdin.write(accountsSql(prodState));
    psql.stdin.write(PASSWORDS_SQL);
  }
  psql.stdin.end();
  const [psqlCode] = await psqlExit;

  if (dumpCode !== 0) {
    throw new ProdToDevError(
      "Reading prod failed (see pg_dump output above). Your local dev DB was left untouched.",
    );
  }
  if (psqlCode !== 0) {
    throw new ProdToDevError(
      "Writing to your local dev DB failed (see psql output above). It was left untouched.",
    );
  }
}

async function prodToDev() {
  const prod = connectionFrom(PROD_ENV_FILE);
  const dev = connectionFrom(DEV_ENV_FILE);
  assertSafeTargets(prod, dev);

  const fallbackPassword = parse(readFileSync(DEV_ENV_FILE))[
    FALLBACK_PASSWORD_VARIABLE
  ];
  if (!fallbackPassword) {
    throw new ProdToDevError(
      `The ${FALLBACK_PASSWORD_VARIABLE} environment variable must have a non-empty value in ${DEV_ENV_FILE}, it becomes the password of prod users who have no password in your local dev DB`,
    );
  }

  console.log("Reading prod (read-only)…");
  const prodState = await readProd(prod);
  const devMigrations = await withClient(
    devClientConfig(dev),
    appliedMigrations,
  );
  const problems = migrationProblems(prodState.migrations, devMigrations);
  if (problems.length) {
    throw new ProdToDevError(
      `Prod and your local dev DB are not on the same migrations. Nothing was changed.\n\n${problems.join("\n\n")}`,
    );
  }

  const fallbackHash = await hashPassword(fallbackPassword);
  console.log("Replacing your local dev DB with a copy of prod…");
  await copyProdToDev(prod, dev, prodState, fallbackHash);

  const summary = await withClient(devClientConfig(dev), async (client) => {
    const { rows } = await client.query<{
      users: number;
      kept: number;
      fallback: number;
    }>(SUMMARY_QUERY, [fallbackHash]);
    return rows[0];
  });
  console.log(
    `Done. Your local dev DB is now a copy of prod with ${summary?.users} users: ${summary?.kept} kept their local dev password, ${summary?.fallback} got ${FALLBACK_PASSWORD_VARIABLE} from ${DEV_ENV_FILE}. Sessions and verification tokens were not copied.`,
  );
}

prodToDev().catch((error) => {
  console.error(
    error instanceof ProdToDevError ? `✋ ${error.message}` : error,
  );
  process.exitCode = 1;
});
