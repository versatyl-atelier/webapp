import "dotenv/config";

import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";

import { chromium, type BrowserContext, type Page } from "playwright";

import {
  CHANGE_PASSWORD_PATH,
  INVALID_CREDENTIALS_MESSAGE,
  LOGIN_PATH,
} from "@/constants/auth";
import { HOME_PATH } from "@/constants/tools";
import { loginPath } from "@/lib/paths";

const DEFAULT_WIDTHS = [360, 768, 1280];
const DEFAULT_HEIGHT = 800;
const DEFAULT_BASE_URL = "http://localhost:3000";
const DEFAULT_OUT_DIR = "screenshots";
const COLOR_SCHEMES = ["light", "dark"] as const;
const DEFAULT_COLOR_SCHEME = "light";
const STORAGE_STATE_PATH = ".auth/screenshots.json";
const STORAGE_STATE_FILE_MODE = 0o600;
const INDEX_FILE = "index.html";
const EMAIL_VARIABLES = ["SCREENSHOT_EMAIL", "SEED_MANAGER_EMAIL"];
const PASSWORD_VARIABLES = ["SCREENSHOT_PASSWORD", "SEED_MANAGER_PASSWORD"];
const EMAIL_INPUT = "#email";
const PASSWORD_INPUT = "#password";
const SUBMIT_BUTTON = 'button[type="submit"]';
const NAVIGATION_TIMEOUT_MS = 60_000;
const SELECTOR_TIMEOUT_MS = 10_000;
const LOGIN_TIMEOUT_MS = 30_000;
const REACHABILITY_TIMEOUT_MS = 5_000;
const ERROR_STATUS = 400;
const DEVICE_SCALE_FACTOR = 1;
const HIDDEN_DURING_SCREENSHOT = "nextjs-portal { display: none !important; }";
const HOME_SLUG = "home";
const FULL_PAGE_SLUG = "full-page";
const SLUG_SEPARATOR = "-";
const NON_SLUG_CHARACTERS = /[^a-z0-9]+/g;
const EDGE_SEPARATORS = /^-+|-+$/g;
const NAME_PART_SEPARATOR = ".";
const WIDTH_SUFFIX = "w";
const LIST_SEPARATOR = ",";
const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};
const HTML_SPECIAL_CHARACTERS = /[&<>"]/g;

const USAGE = `Usage: npm run screenshot -- <path...> [options]

Captures each path at each width and prints the written files, one per line.

Options:
  --widths <list>        Comma-separated viewport widths (default: ${DEFAULT_WIDTHS.join(LIST_SEPARATOR)})
  --height <px>          Viewport height (default: ${DEFAULT_HEIGHT})
  --full-page            Capture the whole scrollable page instead of the viewport
  --scroll <selector>    Scroll this element to the top of the viewport first (repeatable)
  --element <selector>   Capture only this element (repeatable)
  --wait-for <selector>  Wait for this element before capturing
  --color-scheme <name>  ${COLOR_SCHEMES.join(" or ")} (default: ${DEFAULT_COLOR_SCHEME})
  --signed-out           Capture as a visitor: no saved session, no sign-in
  --base-url <url>       App URL (default: ${DEFAULT_BASE_URL})
  --out <dir>            Output folder (default: ${DEFAULT_OUT_DIR})
  --help                 Show this help

Example: npm run screenshot -- /punch / --widths 360,1280 --scroll "#weekly-stats"`;

class ScreenshotError extends Error {}

type ColorScheme = (typeof COLOR_SCHEMES)[number];

type Target =
  | { kind: "viewport" }
  | { kind: "fullPage" }
  | { kind: "scroll"; selector: string }
  | { kind: "element"; selector: string };

type Options = {
  paths: string[];
  widths: number[];
  height: number;
  targets: Target[];
  waitFor: string | undefined;
  signedOut: boolean;
  colorScheme: ColorScheme;
  baseUrl: string;
  outDir: string;
};

type Shot = { path: string; target: Target; width: number };

type Result = Shot & { file: string };

function isColorScheme(value: string): value is ColorScheme {
  return COLOR_SCHEMES.some((scheme) => scheme === value);
}

function positiveInteger(value: string, name: string) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new ScreenshotError(
      `${name} must be a positive integer, got "${value}"`,
    );
  }
  return number;
}

function targetsFrom(
  scroll: string[],
  element: string[],
  fullPage: boolean,
): Target[] {
  const targets: Target[] = [
    ...scroll.map((selector) => ({ kind: "scroll" as const, selector })),
    ...element.map((selector) => ({ kind: "element" as const, selector })),
  ];
  if (fullPage && targets.length > 0) {
    throw new ScreenshotError(
      "--full-page cannot be combined with --scroll or --element",
    );
  }
  if (targets.length > 0) {
    return targets;
  }
  return [{ kind: fullPage ? "fullPage" : "viewport" }];
}

function parseArguments(args: string[]): Options | null {
  let parsed;
  try {
    parsed = parseArgs({
      args,
      allowPositionals: true,
      options: {
        widths: { type: "string" },
        height: { type: "string" },
        "full-page": { type: "boolean", default: false },
        scroll: { type: "string", multiple: true, default: [] },
        element: { type: "string", multiple: true, default: [] },
        "wait-for": { type: "string" },
        "signed-out": { type: "boolean", default: false },
        "color-scheme": { type: "string", default: DEFAULT_COLOR_SCHEME },
        "base-url": { type: "string", default: DEFAULT_BASE_URL },
        out: { type: "string", default: DEFAULT_OUT_DIR },
        help: { type: "boolean", default: false },
      },
    });
  } catch (error) {
    throw new ScreenshotError(
      `${error instanceof Error ? error.message : error}\n\n${USAGE}`,
    );
  }
  const { positionals, values } = parsed;
  if (values.help) {
    return null;
  }
  if (positionals.length === 0) {
    throw new ScreenshotError(USAGE);
  }
  const colorScheme = values["color-scheme"];
  if (!isColorScheme(colorScheme)) {
    throw new ScreenshotError(
      `--color-scheme must be ${COLOR_SCHEMES.join(" or ")}, got "${colorScheme}"`,
    );
  }
  return {
    paths: positionals.map((path) =>
      path.startsWith("/") ? path : `/${path}`,
    ),
    widths: values.widths
      ? values.widths
          .split(LIST_SEPARATOR)
          .map((width) => positiveInteger(width.trim(), "--widths"))
      : DEFAULT_WIDTHS,
    height: values.height
      ? positiveInteger(values.height, "--height")
      : DEFAULT_HEIGHT,
    targets: targetsFrom(
      values.scroll,
      values.element,
      values["full-page"] === true,
    ),
    waitFor: values["wait-for"],
    signedOut: values["signed-out"] === true,
    colorScheme,
    baseUrl: values["base-url"],
    outDir: values.out,
  };
}

function firstVariable(names: string[]) {
  return names.map((name) => process.env[name]).find(Boolean);
}

function credentials() {
  const email = firstVariable(EMAIL_VARIABLES);
  const password = firstVariable(PASSWORD_VARIABLES);
  if (!email || !password) {
    throw new ScreenshotError(
      `This page needs a signed-in user: set ${EMAIL_VARIABLES.join(" or ")} and ${PASSWORD_VARIABLES.join(" or ")} in .env or the environment`,
    );
  }
  return { email, password };
}

async function assertReachable(baseUrl: string) {
  try {
    await fetch(baseUrl, {
      redirect: "manual",
      signal: AbortSignal.timeout(REACHABILITY_TIMEOUT_MS),
    });
  } catch {
    throw new ScreenshotError(
      `${baseUrl} is not reachable. Start the dev server with \`npm run dev\`, or pass --base-url.`,
    );
  }
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(NON_SLUG_CHARACTERS, SLUG_SEPARATOR)
    .replace(EDGE_SEPARATORS, "");
}

function targetName(target: Target) {
  if (target.kind === "viewport") {
    return null;
  }
  if (target.kind === "fullPage") {
    return FULL_PAGE_SLUG;
  }
  return `${target.kind}${SLUG_SEPARATOR}${slug(target.selector)}`;
}

function fileName({ path, target, width }: Shot, colorScheme: ColorScheme) {
  return [
    slug(path) || HOME_SLUG,
    targetName(target),
    `${width}${WIDTH_SUFFIX}`,
    colorScheme === DEFAULT_COLOR_SCHEME ? null : colorScheme,
    "png",
  ]
    .filter(Boolean)
    .join(NAME_PART_SEPARATOR);
}

function targetLabel(target: Target) {
  if (target.kind === "viewport" || target.kind === "fullPage") {
    return target.kind;
  }
  return `${target.kind} ${target.selector}`;
}

async function saveStorageState(context: BrowserContext) {
  await mkdir(dirname(STORAGE_STATE_PATH), { recursive: true });
  await writeFile(
    STORAGE_STATE_PATH,
    JSON.stringify(await context.storageState()),
    { mode: STORAGE_STATE_FILE_MODE },
  );
}

async function login(page: Page, baseUrl: string) {
  const { email, password } = credentials();
  console.error("Signing in…");
  await page.goto(new URL(loginPath(HOME_PATH), baseUrl).href);
  await page.locator(EMAIL_INPUT).fill(email);
  await page.locator(PASSWORD_INPUT).fill(password);
  await page.locator(SUBMIT_BUTTON).click();
  const outcome = await Promise.race([
    page
      .waitForURL((url) => url.pathname !== LOGIN_PATH, {
        timeout: LOGIN_TIMEOUT_MS,
      })
      .then(() => "signedIn" as const)
      .catch(() => "timedOut" as const),
    page
      .getByText(INVALID_CREDENTIALS_MESSAGE)
      .waitFor({ timeout: LOGIN_TIMEOUT_MS })
      .then(() => "invalid" as const)
      .catch(() => "timedOut" as const),
  ]);
  if (outcome === "timedOut") {
    throw new ScreenshotError(
      `Sign-in did not finish within ${LOGIN_TIMEOUT_MS}ms`,
    );
  }
  if (outcome === "invalid") {
    throw new ScreenshotError(
      `Sign-in failed: ${INVALID_CREDENTIALS_MESSAGE}. Check ${EMAIL_VARIABLES.join(" / ")} and ${PASSWORD_VARIABLES.join(" / ")}.`,
    );
  }
  if (new URL(page.url()).pathname === CHANGE_PASSWORD_PATH) {
    throw new ScreenshotError(
      "Sign-in worked but this user must change their password first. Sign in once in a browser to change it.",
    );
  }
  await saveStorageState(page.context());
}

async function open(page: Page, path: string, baseUrl: string) {
  const response = await page.goto(new URL(path, baseUrl).href, {
    waitUntil: "networkidle",
  });
  if (response && response.status() >= ERROR_STATUS) {
    console.error(`⚠️  ${path} answered ${response.status()}`);
  }
  return new URL(page.url()).pathname === LOGIN_PATH && path !== LOGIN_PATH;
}

async function firstMatch(page: Page, selector: string) {
  const locator = page.locator(selector).first();
  try {
    await locator.waitFor({ timeout: SELECTOR_TIMEOUT_MS });
  } catch {
    throw new Error(
      `no visible element matches ${selector} after ${SELECTOR_TIMEOUT_MS}ms`,
    );
  }
  return locator;
}

async function capture(
  page: Page,
  { path, target }: Shot,
  file: string,
  options: Options,
) {
  const redirectedToLogin = await open(page, path, options.baseUrl);
  if (redirectedToLogin && !options.signedOut) {
    await login(page, options.baseUrl);
    if (await open(page, path, options.baseUrl)) {
      throw new ScreenshotError(
        `${path} still redirects to ${LOGIN_PATH} after signing in`,
      );
    }
  }
  if (options.waitFor) {
    await firstMatch(page, options.waitFor);
  }
  await page.evaluate(() => document.fonts.ready);
  const screenshotOptions = {
    path: file,
    animations: "disabled" as const,
    style: HIDDEN_DURING_SCREENSHOT,
  };
  if (target.kind === "viewport" || target.kind === "fullPage") {
    await page.screenshot({
      ...screenshotOptions,
      fullPage: target.kind === "fullPage",
    });
    return;
  }
  const locator = await firstMatch(page, target.selector);
  if (target.kind === "element") {
    await locator.screenshot(screenshotOptions);
    return;
  }
  await locator.evaluate((element) =>
    element.scrollIntoView({ block: "start", behavior: "instant" }),
  );
  await page.screenshot(screenshotOptions);
}

function escapeHtml(value: string) {
  return value.replace(
    HTML_SPECIAL_CHARACTERS,
    (character) => HTML_ESCAPES[character] ?? character,
  );
}

function indexHtml(results: Result[], options: Options) {
  const rows = Map.groupBy(
    results,
    ({ path, target }) => `${path} · ${targetLabel(target)}`,
  );
  const sections = [...rows]
    .map(
      ([title, shots]) => `<section>
<h2>${escapeHtml(title)}</h2>
<div class="row">
${shots
  .map(
    ({ file, width }) => `<figure>
<figcaption>${width}px</figcaption>
<a href="${escapeHtml(file)}"><img src="${escapeHtml(file)}" width="${width}" alt="${escapeHtml(`${title} at ${width}px`)}"></a>
</figure>`,
  )
  .join("\n")}
</div>
</section>`,
    )
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Screenshots</title>
<style>
body { margin: 1rem; font-family: system-ui, sans-serif; background: #f4f4f5; color: #18181b; }
h1 { font-size: 1.25rem; }
h2 { font-size: 1rem; font-weight: 600; }
.row { display: flex; gap: 1.5rem; align-items: flex-start; overflow-x: auto; padding-bottom: 1rem; }
figure { margin: 0; flex: none; }
figcaption { font-size: 0.875rem; margin-bottom: 0.25rem; }
img { display: block; height: auto; border: 1px solid #d4d4d8; background: white; }
</style>
</head>
<body>
<h1>${escapeHtml(`${options.baseUrl} · ${options.colorScheme} · ${new Date().toLocaleString()}`)}</h1>
${sections}
</body>
</html>
`;
}

function shotsFrom({ paths, targets, widths }: Options): Shot[] {
  return paths.flatMap((path) =>
    targets.flatMap((target) =>
      widths.map((width) => ({ path, target, width })),
    ),
  );
}

function firstLine(error: unknown) {
  return (error instanceof Error ? error.message : String(error)).split(
    "\n",
  )[0];
}

async function captureAll(
  context: BrowserContext,
  options: Options,
  outDir: string,
  results: Result[],
  failures: string[],
) {
  const page = await context.newPage();
  page.on("pageerror", (error) =>
    console.error(`⚠️  ${page.url()}: ${firstLine(error)}`),
  );
  for (const shot of shotsFrom(options)) {
    const label = `${shot.path} · ${targetLabel(shot.target)} · ${shot.width}px`;
    const file = join(outDir, fileName(shot, options.colorScheme));
    console.error(label);
    await page.setViewportSize({ width: shot.width, height: options.height });
    try {
      await capture(page, shot, file, options);
      results.push({ ...shot, file });
    } catch (error) {
      if (error instanceof ScreenshotError) {
        throw error;
      }
      failures.push(`✋ ${label}: ${firstLine(error)}`);
    }
  }
}

async function screenshot() {
  const options = parseArguments(process.argv.slice(2));
  if (!options) {
    console.log(USAGE);
    return;
  }
  await assertReachable(options.baseUrl);
  const outDir = resolve(options.outDir);
  await mkdir(outDir, { recursive: true });

  const results: Result[] = [];
  const failures: string[] = [];
  let fatalError: unknown = null;
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      colorScheme: options.colorScheme,
      deviceScaleFactor: DEVICE_SCALE_FACTOR,
      ...(!options.signedOut && existsSync(STORAGE_STATE_PATH)
        ? { storageState: STORAGE_STATE_PATH }
        : {}),
    });
    context.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS);
    await captureAll(context, options, outDir, results, failures);
  } catch (error) {
    fatalError = error;
  } finally {
    await browser.close();
  }

  const indexFile = join(outDir, INDEX_FILE);
  await writeFile(
    indexFile,
    indexHtml(
      results.map((result) => ({
        ...result,
        file: relative(outDir, result.file),
      })),
      options,
    ),
  );
  failures.forEach((failure) => console.error(failure));
  console.log([...results.map(({ file }) => file), indexFile].join("\n"));
  if (fatalError) {
    throw fatalError;
  }
  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

screenshot().catch((error) => {
  console.error(
    error instanceof ScreenshotError ? `✋ ${error.message}` : error,
  );
  process.exitCode = 1;
});
