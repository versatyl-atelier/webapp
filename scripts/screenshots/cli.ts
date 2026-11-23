import { join } from "node:path";
import { parseArgs } from "node:util";

import {
  DEFAULT_CONCURRENCY,
  DEFAULT_ENV,
  DEFAULT_HEIGHT,
  DEFAULT_MODES,
  DEFAULT_ROLE,
  DEFAULT_WIDTHS,
  ENVS,
  KEPT_UNNAMED_RUNS,
  MODES,
  PRESETS,
  ROLES,
} from "./config";
import { executeRun, prepareRun } from "./capture";
import { compareSides, compareSummary } from "./compare";
import { ScreenshotError } from "./envs";
import { buildParams } from "./params";
import { INDEX_FILE, cleanRuns, resolveRun, runDir, shotPath } from "./runs";
import { startServer } from "./server";
import { shotLabel } from "./shots";
import type { CaptureEvent, Manifest } from "./types";

const LIST_SEPARATOR = ",";
const DEFAULT_REF = "HEAD";
const DEFAULT_PORT = 4300;
const JSON_INDENT = 2;

const CAPTURE_USAGE = `Usage: npm run screenshot -- [<path>...] [options]

Captures pages into screenshots/runs/<run>/<env>/ and prints the written files, one per line.

Pages:
  <path>...                Paths such as /punch or /projets/abc
  --preset <name>          Pages from scripts/screenshots/config.ts: ${Object.keys(PRESETS).join(", ")} (repeatable)
  --changed                Pages whose files under src/app changed since HEAD (all pages if other src/ files changed)
  --changed-since <ref>    Same, since a git ref
Screens:
  --widths <list>          Viewport widths (default: ${DEFAULT_WIDTHS.join(LIST_SEPARATOR)})
  --height <px>            Viewport height (default: ${DEFAULT_HEIGHT})
  --modes <list>           ${MODES.join(", ")} or all (default: ${DEFAULT_MODES.join(LIST_SEPARATOR)})
  --env <list>             ${Object.keys(ENVS).join(", ")} (default: ${DEFAULT_ENV})
  --full-page              Whole scrollable page instead of the viewport
  --scroll <selector>      Scroll this element to the top first (repeatable)
  --element <selector>     Capture only this element (repeatable)
  --sections               Also capture the sections listed in the config for each page
  --mask <selector>        Cover this element with a solid box (repeatable)
  --wait-for <selector>    Wait for this element before capturing
  --signed-out             No saved session and no sign-in
  --as <role>              Sign in as ${ROLES.join(" or ")} (default: ${DEFAULT_ROLE})
Run:
  --name <name>            Name the run (replaces a run with the same name). Unnamed runs: only the last ${KEPT_UNNAMED_RUNS} are kept
  --like <run>             Start from the parameters of an earlier run (or "latest")
  --concurrency <n>        Pages captured in parallel (default: ${DEFAULT_CONCURRENCY})
  --clock <iso|none>       Browser clock on local (default: fixed at the run start, --like reuses the run's)
  --compare                Then compare the first two envs of this run
  --help                   Show this help

Examples:
  npm run screenshot -- /punch --modes all
  npm run screenshot -- --preset punch --name before
  npm run screenshot -- --like before --name after && npm run screenshot:compare -- before after`;

const COMPARE_USAGE = `Usage: npm run screenshot:compare -- <before> <after> [--json]

<before> and <after> are runs (a name, a timestamp or "latest"), with ":<env>" when the run has several envs, e.g. latest:local latest:prod.
Prints the shots that differ, most different first, with paths to the before, after and diff images.`;

const CLEAN_USAGE = `Usage: npm run screenshot:clean -- [--keep <n>] [--named]

Deletes unnamed runs, keeping the <n> most recent (default: 0). --named deletes named runs too.`;

const UI_USAGE = `Usage: npm run screenshot:ui -- [--port <n>]

Starts the screenshot UI on 127.0.0.1 (default port: ${DEFAULT_PORT}).`;

function parse<T>(run: () => T, usage: string) {
  try {
    return run();
  } catch (error) {
    throw new ScreenshotError(
      `${error instanceof Error ? error.message : error}\n\n${usage}`,
    );
  }
}

function wholeNumber(value: string | undefined, fallback: number) {
  const number = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new ScreenshotError(`Expected a whole number, got "${value}"`);
  }
  return number;
}

export function reportEvent(total: number) {
  let done = 0;
  return (event: CaptureEvent) => {
    if (event.kind === "info") {
      console.error(event.message);
      return;
    }
    if (event.kind === "warning") {
      console.error(`⚠️  ${event.message}`);
      return;
    }
    done += 1;
    const { result } = event;
    const label = `[${done}/${total}] ${result.env} · ${shotLabel(result)}`;
    console.error(result.error ? `✋ ${label}: ${result.error}` : `✓ ${label}`);
  };
}

function writtenFiles(manifest: Manifest) {
  return [
    ...manifest.shots
      .filter(({ error }) => !error)
      .map(({ file }) => shotPath(manifest.id, file)),
    join(runDir(manifest.id), INDEX_FILE),
  ];
}

async function capture(args: string[]) {
  const { values, positionals } = parse(
    () =>
      parseArgs({
        args,
        allowPositionals: true,
        options: {
          preset: { type: "string", multiple: true },
          changed: { type: "boolean" },
          "changed-since": { type: "string" },
          widths: { type: "string" },
          height: { type: "string" },
          modes: { type: "string" },
          env: { type: "string" },
          "full-page": { type: "boolean" },
          scroll: { type: "string", multiple: true },
          element: { type: "string", multiple: true },
          sections: { type: "boolean" },
          mask: { type: "string", multiple: true },
          "wait-for": { type: "string" },
          "signed-out": { type: "boolean" },
          as: { type: "string" },
          name: { type: "string" },
          like: { type: "string" },
          concurrency: { type: "string" },
          clock: { type: "string" },
          compare: { type: "boolean" },
          help: { type: "boolean" },
        },
      }),
    CAPTURE_USAGE,
  );
  if (values.help) {
    console.log(CAPTURE_USAGE);
    return;
  }
  const base = values.like ? (await resolveRun(values.like)).params : null;
  const params = await buildParams(
    {
      paths: positionals,
      presets: values.preset,
      changedSince:
        values["changed-since"] ?? (values.changed ? DEFAULT_REF : undefined),
      widths: values.widths,
      height: values.height,
      modes: values.modes,
      envs: values.env,
      fullPage: values["full-page"],
      scroll: values.scroll,
      element: values.element,
      sections: values.sections,
      masks: values.mask,
      waitFor: values["wait-for"],
      signedOut: values["signed-out"],
      as: values.as,
      concurrency: values.concurrency,
      clock: values.clock,
    },
    base,
  );
  if (values.compare && params.envs.length < 2) {
    throw new ScreenshotError("--compare needs at least two envs in --env");
  }
  const manifest = await prepareRun(values.name ?? null, params);
  console.error(
    `Run ${manifest.id}: ${manifest.total} shots of ${params.paths.join(" ")}`,
  );
  try {
    await executeRun(manifest, reportEvent(manifest.total));
  } finally {
    console.log(writtenFiles(manifest).join("\n"));
  }
  const [envA, envB] = params.envs;
  if (values.compare && envA && envB) {
    const { report, index } = await compareSides(
      `${manifest.id}:${envA}`,
      `${manifest.id}:${envB}`,
    );
    console.log(compareSummary(report, index));
  }
  if (manifest.shots.some(({ error }) => error)) {
    process.exitCode = 1;
  }
}

async function compare(args: string[]) {
  const { values, positionals } = parse(
    () =>
      parseArgs({
        args,
        allowPositionals: true,
        options: {
          json: { type: "boolean", default: false },
          help: { type: "boolean", default: false },
        },
      }),
    COMPARE_USAGE,
  );
  const [before, after] = positionals;
  if (values.help || !before || !after || positionals.length !== 2) {
    if (!values.help) {
      throw new ScreenshotError(COMPARE_USAGE);
    }
    console.log(COMPARE_USAGE);
    return;
  }
  const { report, index } = await compareSides(before, after);
  console.log(
    values.json
      ? JSON.stringify(report, null, JSON_INDENT)
      : compareSummary(report, index),
  );
}

async function clean(args: string[]) {
  const { values } = parse(
    () =>
      parseArgs({
        args,
        options: {
          keep: { type: "string" },
          named: { type: "boolean", default: false },
          help: { type: "boolean", default: false },
        },
      }),
    CLEAN_USAGE,
  );
  if (values.help) {
    console.log(CLEAN_USAGE);
    return;
  }
  const removed = await cleanRuns(
    wholeNumber(values.keep, 0),
    values.named === true,
  );
  console.log(
    removed.length ? `Deleted:\n${removed.join("\n")}` : "Nothing to delete",
  );
}

async function ui(args: string[]) {
  const { values } = parse(
    () =>
      parseArgs({
        args,
        options: {
          port: { type: "string" },
          help: { type: "boolean", default: false },
        },
      }),
    UI_USAGE,
  );
  if (values.help) {
    console.log(UI_USAGE);
    return;
  }
  await startServer(wholeNumber(values.port, DEFAULT_PORT), reportEvent);
}

const COMMANDS: Record<string, (args: string[]) => Promise<void>> = {
  capture,
  compare,
  clean,
  ui,
};

async function main() {
  const [command = "", ...args] = process.argv.slice(2);
  const run = COMMANDS[command];
  if (!run) {
    throw new ScreenshotError(
      `Unknown command "${command}": use ${Object.keys(COMMANDS).join(", ")}`,
    );
  }
  await run(args);
}

main().catch((error) => {
  console.error(
    error instanceof ScreenshotError ? `✋ ${error.message}` : error,
  );
  process.exitCode = 1;
});
