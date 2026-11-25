import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { parseArgs, styleText } from "node:util";

const ROOT = join(import.meta.dirname, "..");
const STATE_FILE = join(ROOT, "node_modules", ".cache", "versatyl-sync.json");
const LOCK_DIR = join(
  tmpdir(),
  `versatyl-sync-${createHash("sha256").update(ROOT).digest("hex").slice(0, 12)}.lock`,
);
const LOCK_PID_FILE = "pid";

const PACKAGE_FILE = "package.json";
const LOCK_FILE = "package-lock.json";
const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "overrides",
  "allowScripts",
];

const SCHEMA_FILE = "prisma/schema.prisma";
const GENERATOR_PACKAGES = [
  "prisma",
  "@prisma/client",
  "effect-prisma-generator",
];
const GENERATED_CLIENT_DIR = "src/generated/prisma";
const GENERATED_EFFECT_FILE = "src/generated/effect-prisma.ts";

const ENV_EXAMPLE_FILE = ".env.example";
const LOCAL_ENV_FILE = ".env";
const ENV_FILES = [LOCAL_ENV_FILE, ".env.staging", ".env.prod"];
const DB_URL_KEYS = ["DATABASE_URL_UNPOOLED", "DATABASE_URL"];
const LOCAL_DB_HOSTS = ["localhost", "127.0.0.1", "::1", "[::1]"];
const LOCAL_DB_DOMAIN = "localtest.me";
const DB_CONNECT_TIMEOUT_MS = 2000;
const STRIPPED_CHILD_ENV = ["DOTENV_CONFIG_PATH"];
const GIT_ENV_PREFIX = "GIT_";

const MIGRATIONS_DIR = "prisma/migrations";
const MIGRATION_FILE = "migration.sql";
const MIGRATIONS_TABLE = "_prisma_migrations";
const UNDEFINED_TABLE_ERROR = "42P01";
const UNREACHABLE_ERRORS = [
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EHOSTUNREACH",
];

const PLAYWRIGHT_BROWSERS_FILE = "node_modules/playwright-core/browsers.json";
const PLAYWRIGHT_BROWSER = "chromium-headless-shell";
const PLAYWRIGHT_BROWSER_DIR_PREFIX = "chromium_headless_shell-";

const HOOKS_PATH = ".githooks";
const GIT_HOOKS = ["post-merge", "post-rewrite", "post-checkout"];
const DEV_HOOK = "predev";
const MODE_CONFIG_KEY = "versatyl.sync";
const MODE_ENV_KEY = "VERSATYL_SYNC";
const MODES = ["auto", "check", "off"] as const;
const DEFAULT_MODE = "check";
const SAFE_FALLBACK_MODE = "check";
const NULL_SHA = /^0+$/;
const SYNC_COMMAND = "npm run sync";
const IS_WINDOWS = process.platform === "win32";
const IS_MAC = process.platform === "darwin";

const NOTIFY_CONFIG_KEY = "versatyl.notify";
const NOTIFY_OFF = "false";
const NOTIFIED_FILE = "versatyl-sync-notified";
const NOTIFICATION_TITLE = `Versatyl: ${SYNC_COMMAND}`;
const NOTIFICATION_SEPARATOR = " · ";
const NOTIFICATION_MAX_LENGTH = 200;
const NOTIFICATION_TITLE_ENV = "VERSATYL_SYNC_TITLE";
const NOTIFICATION_BODY_ENV = "VERSATYL_SYNC_BODY";
const WINDOWS_NOTIFICATION_SECONDS = 10;
const WINDOWS_NOTIFICATION_SCRIPT = [
  "Add-Type -AssemblyName System.Windows.Forms",
  "Add-Type -AssemblyName System.Drawing",
  "$n = New-Object System.Windows.Forms.NotifyIcon",
  "$n.Icon = [System.Drawing.SystemIcons]::Warning",
  "$n.Visible = $true",
  `$n.ShowBalloonTip(${WINDOWS_NOTIFICATION_SECONDS * 1000}, $env:${NOTIFICATION_TITLE_ENV}, $env:${NOTIFICATION_BODY_ENV}, [System.Windows.Forms.ToolTipIcon]::Warning)`,
  `Start-Sleep -Seconds ${WINDOWS_NOTIFICATION_SECONDS}`,
  "$n.Dispose()",
].join("; ");

type Mode = (typeof MODES)[number];
type Level = "ok" | "done" | "info" | "optional" | "required";
type Result = { level: Level; message: string; fixable: boolean };
type State = { deps?: string; client?: string };
type Run = {
  check: boolean;
  force: boolean;
  quiet: boolean;
  state: State;
  results: Result[];
};
type Style = Parameters<typeof styleText>[0];
type Color = Exclude<Style, readonly unknown[]>;

const ICONS: Record<Level, string> = {
  ok: "✓",
  done: "↻",
  info: "·",
  optional: "⚠",
  required: "✗",
};

const STYLES: Record<Level, Color> = {
  ok: "green",
  done: "green",
  info: "dim",
  optional: "yellow",
  required: "red",
};

const USAGE = `Usage: ${SYNC_COMMAND} -- [options]

Brings this checkout in line with its code, after a pull, a branch switch or a rebase.
Safe to run any time: it only does what is out of date, never deletes data and only touches the local database.

  1. ${ENV_FILES.join(", ")}: lists keys of ${ENV_EXAMPLE_FILE} they lack
  2. npm install, when ${PACKAGE_FILE} or ${LOCK_FILE} changed
  3. npm run db:generate, when the Prisma schema or Prisma changed
  4. npm run db:deploy, when migrations are pending on the local database (${LOCAL_ENV_FILE})
  5. The Playwright browser, when you already have one and Playwright changed
  6. Checks that the git hooks are on

The last line sums it up: green, nothing to do; yellow, optional; red, action required.

Options:
  --check      Report what is out of date, change nothing (exits with 1 if action is required)
  --force      Run npm install and db:generate even if nothing seems to have changed
  --skip-db    Leave the database alone
  --help       Show this help

Git hooks (after pull, merge, rebase and branch switch) and npm run dev run it too. Choose what they do:
  git config ${MODE_CONFIG_KEY} check    Only report what is out of date (default)
  git config ${MODE_CONFIG_KEY} auto     Sync
  git config ${MODE_CONFIG_KEY} off      Do nothing
  ${MODE_ENV_KEY}=auto git pull       For one command only

When a git hook finds action required and no terminal shows its output (VS Code, GitHub Desktop…),
it sends a desktop notification, once per problem. Turn that off with: git config ${NOTIFY_CONFIG_KEY} ${NOTIFY_OFF}
`;

function paint(style: Style, text: string): string {
  return styleText(style, text);
}

function report(
  run: Run,
  level: Level,
  message: string,
  fixable = false,
): void {
  run.results.push({ level, message, fixable });
  if (run.quiet && (level === "ok" || level === "info")) return;
  console.log(`${paint(STYLES[level], ICONS[level])} ${message}`);
}

function announce(message: string): void {
  console.log(paint("cyan", `→ ${message}`));
}

function childEnv(overrides: Record<string, string> = {}): NodeJS.ProcessEnv {
  const env = { ...process.env, ...overrides };
  for (const key of Object.keys(env)) {
    if (key.startsWith(GIT_ENV_PREFIX) || STRIPPED_CHILD_ENV.includes(key)) {
      delete env[key];
    }
  }
  return env;
}

function exec(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv = childEnv(),
): boolean {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    env,
    stdio: "inherit",
    shell: IS_WINDOWS,
  });
  return result.status === 0;
}

function git(args: string[]): string {
  const result = spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "";
}

function gitPath(name: string): string {
  const path = git(["rev-parse", "--git-path", name]);
  return path ? resolve(ROOT, path) : "";
}

function file(path: string): string {
  const full = join(ROOT, path);
  return existsSync(full) ? readFileSync(full, "utf8") : "";
}

function hash(parts: string[]): string {
  const digest = createHash("sha256");
  for (const part of parts) digest.update(part).update("\0");
  return digest.digest("hex");
}

function readState(): State {
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf8")) as State;
  } catch {
    return {};
  }
}

function writeState(state: State): void {
  mkdirSync(dirname(STATE_FILE), { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state));
}

function depsHash(): string {
  const pkg = JSON.parse(file(PACKAGE_FILE)) as Record<string, unknown>;
  const fields = DEPENDENCY_FIELDS.map((field) =>
    JSON.stringify(pkg[field] ?? null),
  );
  return hash([...fields, file(LOCK_FILE)]);
}

function installedVersion(name: string): string {
  const manifest = file(join("node_modules", name, PACKAGE_FILE));
  return manifest
    ? String((JSON.parse(manifest) as { version?: string }).version)
    : "";
}

function clientHash(): string {
  return hash([file(SCHEMA_FILE), ...GENERATOR_PACKAGES.map(installedVersion)]);
}

function generatedAt(): number {
  const path = join(ROOT, GENERATED_EFFECT_FILE);
  return existsSync(path) ? statSync(path).mtimeMs : 0;
}

function parseEnv(text: string): Map<string, string> {
  const values = new Map<string, string>();
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) continue;
    const raw = (match[2] ?? "").trim();
    const quoted = raw.match(/^(["'`])(.*)\1$/);
    values.set(match[1], quoted ? quoted[2] : raw.replace(/\s+#.*$/, ""));
  }
  return values;
}

function lock(): boolean {
  try {
    mkdirSync(LOCK_DIR);
  } catch {
    const pid = Number(readPid());
    if (pid && isAlive(pid)) return false;
    rmSync(LOCK_DIR, { recursive: true, force: true });
    mkdirSync(LOCK_DIR);
  }
  writeFileSync(join(LOCK_DIR, LOCK_PID_FILE), String(process.pid));
  process.on("exit", () => rmSync(LOCK_DIR, { recursive: true, force: true }));
  return true;
}

function readPid(): string {
  try {
    return readFileSync(join(LOCK_DIR, LOCK_PID_FILE), "utf8");
  } catch {
    return "";
  }
}

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function checkEnvFiles(run: Run): void {
  const example = parseEnv(file(ENV_EXAMPLE_FILE));
  if (!existsSync(join(ROOT, LOCAL_ENV_FILE))) {
    report(
      run,
      "required",
      `No ${LOCAL_ENV_FILE}: cp ${ENV_EXAMPLE_FILE} ${LOCAL_ENV_FILE}, then fill it in (see README.md)`,
    );
  }
  for (const name of ENV_FILES) {
    if (!existsSync(join(ROOT, name))) continue;
    const present = parseEnv(file(name));
    const missing = [...example.keys()].filter((key) => !present.has(key));
    if (missing.length === 0) {
      report(run, "ok", `${name} has every key of ${ENV_EXAMPLE_FILE}`);
    } else {
      report(
        run,
        name === LOCAL_ENV_FILE ? "required" : "info",
        `${name} lacks ${missing.join(", ")} (see ${ENV_EXAMPLE_FILE} and docs/)`,
      );
    }
  }
}

function syncDependencies(run: Run): boolean {
  const current = depsHash();
  const installed = existsSync(join(ROOT, "node_modules"));
  if (installed && run.state.deps === current && !run.force) {
    report(run, "ok", "Dependencies up to date");
    return true;
  }
  if (run.check) {
    const reason = run.state.deps
      ? "changed"
      : "may be out of date (never synced)";
    report(run, "required", `Dependencies ${reason}: npm install`, true);
    return true;
  }
  const lockBefore = file(LOCK_FILE);
  const startedAt = Date.now();
  announce("npm install");
  if (!exec("npm", ["install"])) {
    report(run, "required", "npm install failed (see above)");
    return false;
  }
  run.state.deps = depsHash();
  if (generatedAt() >= startedAt) run.state.client = clientHash();
  writeState(run.state);
  report(run, "done", "Dependencies installed");
  if (file(LOCK_FILE) !== lockBefore) {
    report(
      run,
      "optional",
      `npm install updated ${LOCK_FILE}: commit it if intended, or undo with git checkout ${LOCK_FILE}`,
    );
  }
  return true;
}

function syncClient(run: Run): boolean {
  const current = clientHash();
  const generated =
    existsSync(join(ROOT, GENERATED_CLIENT_DIR)) &&
    existsSync(join(ROOT, GENERATED_EFFECT_FILE));
  if (generated && run.state.client === current && !run.force) {
    report(run, "ok", "Prisma client up to date");
    return true;
  }
  if (run.check) {
    const reason = !generated
      ? "missing"
      : run.state.client
        ? "out of date"
        : "may be out of date (never synced)";
    report(
      run,
      "required",
      `Prisma client ${reason}: npm run db:generate`,
      true,
    );
    return true;
  }
  announce("npm run db:generate");
  if (!exec("npm", ["run", "--silent", "db:generate"])) {
    report(run, "required", "npm run db:generate failed (see above)");
    return false;
  }
  run.state.client = current;
  writeState(run.state);
  report(run, "done", "Prisma client generated");
  return true;
}

function localDatabaseUrl(run: Run): URL | undefined {
  const fromFile = parseEnv(file(LOCAL_ENV_FILE));
  const value = DB_URL_KEYS.map(
    (key) => process.env[key] || fromFile.get(key),
  ).find(Boolean);
  if (!value) {
    report(
      run,
      "required",
      `Database skipped: no ${DB_URL_KEYS.join(" or ")} in ${LOCAL_ENV_FILE}`,
    );
    return undefined;
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    report(
      run,
      "required",
      `Database skipped: ${DB_URL_KEYS.join(" or ")} isn't a valid URL`,
    );
    return undefined;
  }
  const host = url.hostname;
  const local =
    LOCAL_DB_HOSTS.includes(host) ||
    host === LOCAL_DB_DOMAIN ||
    host.endsWith(`.${LOCAL_DB_DOMAIN}`);
  if (!local) {
    report(
      run,
      "optional",
      `Database skipped: it points to ${host}, not a local database. Staging and prod are migrated by their deploys (see docs/data.md)`,
    );
    return undefined;
  }
  return url;
}

async function appliedMigrations(
  url: URL,
): Promise<
  { applied: string[]; failed: string[] } | { level: Level; message: string }
> {
  const require = createRequire(join(ROOT, PACKAGE_FILE));
  const { Client } = require("pg") as typeof import("pg");
  const client = new Client({
    connectionString: url.href,
    connectionTimeoutMillis: DB_CONNECT_TIMEOUT_MS,
  });
  try {
    await client.connect();
  } catch (error) {
    const code = (error as { code?: string }).code ?? "";
    return UNREACHABLE_ERRORS.includes(code) || !code
      ? {
          level: "optional",
          message: `Local database not reachable at ${url.host}, so migrations weren't checked: start Docker and npm run db:dev, then ${SYNC_COMMAND}`,
        }
      : {
          level: "required",
          message: `Can't connect to the local database at ${url.host}: ${(error as Error).message}`,
        };
  }
  try {
    const { rows } = await client.query<{
      migration_name: string;
      finished_at: Date | null;
      rolled_back_at: Date | null;
    }>(
      `SELECT migration_name, finished_at, rolled_back_at FROM ${MIGRATIONS_TABLE}`,
    );
    const live = rows.filter((row) => row.rolled_back_at === null);
    return {
      applied: live
        .filter((row) => row.finished_at !== null)
        .map((row) => row.migration_name),
      failed: live
        .filter((row) => row.finished_at === null)
        .map((row) => row.migration_name),
    };
  } catch (error) {
    if ((error as { code?: string }).code === UNDEFINED_TABLE_ERROR) {
      return { applied: [], failed: [] };
    }
    return {
      level: "required",
      message: `Couldn't read ${MIGRATIONS_TABLE}: ${(error as Error).message}`,
    };
  } finally {
    await client.end();
  }
}

function localMigrations(): string[] {
  const dir = join(ROOT, MIGRATIONS_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((name) =>
    existsSync(join(dir, name, MIGRATION_FILE)),
  );
}

async function syncDatabase(run: Run): Promise<void> {
  const url = localDatabaseUrl(run);
  if (!url) return;
  const database = await appliedMigrations(url);
  if ("message" in database) {
    report(run, database.level, database.message);
    return;
  }
  if (database.failed.length > 0) {
    report(
      run,
      "required",
      `Failed migrations on the local database: ${database.failed.join(", ")}. Fix them by hand (see docs/data.md) or start over with npm run db:reset (erases local data)`,
    );
    return;
  }
  const local = localMigrations();
  const missing = database.applied.filter((name) => !local.includes(name));
  if (missing.length > 0) {
    report(
      run,
      "required",
      `Your local database has migrations this checkout lacks, probably from another branch: ${missing.join(", ")}. Nothing applied. Switch back to that branch, or start over with npm run db:reset (erases local data)`,
    );
    return;
  }
  const pending = local.filter((name) => !database.applied.includes(name));
  if (pending.length === 0) {
    report(run, "ok", "Local database migrations up to date");
    return;
  }
  if (run.check) {
    report(
      run,
      "required",
      `${pending.length} migration(s) pending on the local database: npm run db:deploy`,
      true,
    );
    return;
  }
  announce("npm run db:deploy");
  const env = childEnv(
    Object.fromEntries(DB_URL_KEYS.map((key) => [key, url.href])),
  );
  if (!exec("npm", ["run", "--silent", "db:deploy"], env)) {
    report(run, "required", "npm run db:deploy failed (see above)");
    return;
  }
  report(
    run,
    "done",
    `Applied ${pending.length} migration(s) to the local database`,
  );
}

function playwrightCacheDir(): string {
  if (process.env.PLAYWRIGHT_BROWSERS_PATH)
    return process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (IS_MAC) return join(homedir(), "Library", "Caches", "ms-playwright");
  if (IS_WINDOWS)
    return join(process.env.LOCALAPPDATA ?? homedir(), "ms-playwright");
  return join(
    process.env.XDG_CACHE_HOME ?? join(homedir(), ".cache"),
    "ms-playwright",
  );
}

function syncPlaywright(run: Run): void {
  const manifest = file(PLAYWRIGHT_BROWSERS_FILE);
  const cacheDir = playwrightCacheDir();
  const notSetUp =
    "Playwright browser not set up (only needed for npm run screenshot)";
  if (!manifest || !existsSync(cacheDir)) {
    report(run, "info", notSetUp);
    return;
  }
  const browsers = (
    JSON.parse(manifest) as { browsers: { name: string; revision: string }[] }
  ).browsers;
  const revision = browsers.find(
    (browser) => browser.name === PLAYWRIGHT_BROWSER,
  )?.revision;
  const installed = readdirSync(cacheDir).filter((name) =>
    name.startsWith(PLAYWRIGHT_BROWSER_DIR_PREFIX),
  );
  if (!revision || installed.length === 0) {
    report(run, "info", notSetUp);
    return;
  }
  if (installed.includes(`${PLAYWRIGHT_BROWSER_DIR_PREFIX}${revision}`)) {
    report(run, "ok", "Playwright browser up to date");
    return;
  }
  if (run.check) {
    report(
      run,
      "optional",
      "Playwright browser out of date (only needed for npm run screenshot): npx playwright install --only-shell chromium",
      true,
    );
    return;
  }
  announce("npx playwright install --only-shell chromium");
  if (!exec("npx", ["playwright", "install", "--only-shell", "chromium"])) {
    report(run, "optional", "Playwright browser install failed (see above)");
    return;
  }
  report(run, "done", "Playwright browser installed");
}

function checkHooks(run: Run): void {
  if (git(["config", "core.hooksPath"]) === HOOKS_PATH) {
    report(run, "ok", "Git hooks on");
  } else {
    report(
      run,
      "optional",
      `Git hooks off, so nothing checks after a pull or switch: git config core.hooksPath ${HOOKS_PATH}`,
    );
  }
}

function summarize(run: Run, prefix: string): void {
  const required = run.results.filter((result) => result.level === "required");
  const optional = run.results.some((result) => result.level === "optional");
  const [level, text] =
    required.length > 0
      ? ([
          "required",
          required.every((result) => result.fixable)
            ? `Action required: run ${SYNC_COMMAND}`
            : `Action required: see the ${ICONS.required} lines above`,
        ] as const)
      : optional
        ? ([
            "optional",
            `Nothing required, optional steps in the ${ICONS.optional} lines above`,
          ] as const)
        : (["ok", "No action needed: everything is up to date"] as const);
  console.log(
    paint([STYLES[level], "bold"], `${ICONS[level]} ${prefix}${text}`),
  );
}

function hasTerminal(): boolean {
  return Boolean(process.stdout.isTTY || process.stderr.isTTY);
}

function sendNotification(title: string, body: string): void {
  const [command, args, env]: [string, string[], NodeJS.ProcessEnv] = IS_MAC
    ? [
        "osascript",
        [
          "-e",
          "on run argv",
          "-e",
          "display notification (item 2 of argv) with title (item 1 of argv)",
          "-e",
          "end run",
          title,
          body,
        ],
        process.env,
      ]
    : IS_WINDOWS
      ? [
          "powershell.exe",
          [
            "-NoProfile",
            "-NonInteractive",
            "-WindowStyle",
            "Hidden",
            "-Command",
            WINDOWS_NOTIFICATION_SCRIPT,
          ],
          {
            ...process.env,
            [NOTIFICATION_TITLE_ENV]: title,
            [NOTIFICATION_BODY_ENV]: body,
          },
        ]
      : ["notify-send", [title, body], process.env];
  const child = spawn(command, args, {
    env,
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.on("error", () => {});
  child.unref();
}

function notifyIfUnseen(run: Run, hook: string): void {
  if (!GIT_HOOKS.includes(hook)) return;
  const marker = gitPath(NOTIFIED_FILE);
  if (!marker) return;
  const required = run.results.filter((result) => result.level === "required");
  if (required.length === 0) {
    rmSync(marker, { force: true });
    return;
  }
  if (hasTerminal()) return;
  if (git(["config", "--get", NOTIFY_CONFIG_KEY]) === NOTIFY_OFF) return;
  const key = hash(required.map((result) => result.message));
  if (existsSync(marker) && readFileSync(marker, "utf8") === key) return;
  writeFileSync(marker, key);
  const action = required.every((result) => result.fixable)
    ? `Run ${SYNC_COMMAND}: `
    : "Action required: ";
  const body = `${action}${required.map((result) => result.message).join(NOTIFICATION_SEPARATOR)}`;
  sendNotification(
    NOTIFICATION_TITLE,
    body.length > NOTIFICATION_MAX_LENGTH
      ? `${body.slice(0, NOTIFICATION_MAX_LENGTH - 1)}…`
      : body,
  );
}

function hookMode(): Mode {
  const configured =
    process.env[MODE_ENV_KEY] ||
    git(["config", "--get", MODE_CONFIG_KEY]) ||
    DEFAULT_MODE;
  if ((MODES as readonly string[]).includes(configured))
    return configured as Mode;
  console.log(
    paint(
      STYLES.optional,
      `${ICONS.optional} Unknown ${MODE_CONFIG_KEY} "${configured}" (${MODES.join(", ")}): using ${SAFE_FALLBACK_MODE}`,
    ),
  );
  return SAFE_FALLBACK_MODE;
}

function rebaseInProgress(): boolean {
  return ["rebase-merge", "rebase-apply"].some((name) => {
    const path = gitPath(name);
    return path !== "" && existsSync(path);
  });
}

function hookApplies(hook: string, args: string[]): boolean {
  if (hook === DEV_HOOK || hook === "post-merge") return true;
  if (hook === "post-rewrite") return args[0] === "rebase";
  if (hook === "post-checkout") {
    const [previous = "", next = "", branchSwitch = ""] = args;
    return (
      branchSwitch === "1" &&
      previous !== next &&
      !NULL_SHA.test(previous) &&
      !rebaseInProgress()
    );
  }
  return false;
}

async function main(): Promise<number> {
  const { values, positionals } = parseArgs({
    options: {
      check: { type: "boolean", default: false },
      force: { type: "boolean", default: false },
      "skip-db": { type: "boolean", default: false },
      hook: { type: "string" },
      help: { type: "boolean", default: false },
    },
    allowPositionals: true,
  });
  if (values.help) {
    console.log(USAGE);
    return 0;
  }

  const hook = values.hook ?? "";
  let check = values.check;
  if (hook) {
    if (!hookApplies(hook, positionals)) return 0;
    const mode = hookMode();
    if (mode === "off") return 0;
    check ||= mode === "check";
  }

  if (!check && !lock()) {
    console.log(
      `${paint(STYLES.info, ICONS.info)} Another sync is running in this checkout: skipped`,
    );
    return 0;
  }

  const run: Run = {
    check,
    force: values.force,
    quiet: Boolean(hook),
    state: readState(),
    results: [],
  };
  if (!hook)
    console.log(
      check ? "Checking what is out of date…" : "Syncing this checkout…",
    );

  checkEnvFiles(run);
  if (syncDependencies(run) && syncClient(run)) {
    if (!values["skip-db"]) await syncDatabase(run);
    syncPlaywright(run);
  }
  checkHooks(run);

  if (!hook) console.log();
  summarize(run, hook ? (check ? "Sync check: " : "Sync: ") : "");
  if (hook) {
    try {
      notifyIfUnseen(run, hook);
    } catch {}
    return 0;
  }
  return run.results.some((result) => result.level === "required") ? 1 : 0;
}

process.exitCode = await main();
