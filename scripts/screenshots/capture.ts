import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from "playwright";

import {
  CHANGE_PASSWORD_PATH,
  INVALID_CREDENTIALS_MESSAGE,
  LOGIN_PATH,
} from "@/constants/auth";
import { HOME_PATH } from "@/constants/tools";
import { loginPath } from "@/lib/paths";

import {
  KEPT_UNNAMED_RUNS,
  PRINT_WIDTH,
  pageConfig,
  type SampleLink,
} from "./config";
import {
  BYPASS_SECRET_VARIABLE,
  ScreenshotError,
  loadEnv,
  type Env,
} from "./envs";
import { cleanRuns, createRun, shotPath, writeManifest } from "./runs";
import { shotFile } from "./shots";
import type {
  CaptureEvent,
  Manifest,
  RunParams,
  Shot,
  ShotResult,
  Target,
} from "./types";

const EMAIL_INPUT = "#email";
const PASSWORD_INPUT = "#password";
const SUBMIT_BUTTON = 'button[type="submit"]';
const NAVIGATION_TIMEOUT_MS = 60_000;
const SELECTOR_TIMEOUT_MS = 10_000;
const NETWORK_IDLE_TIMEOUT_MS = 5_000;
const LOGIN_TIMEOUT_MS = 30_000;
const REACHABILITY_TIMEOUT_MS = 5_000;
const ERROR_STATUS = 400;
const DEVICE_SCALE_FACTOR = 1;
const STORAGE_STATE_FILE_MODE = 0o600;
const HIDDEN_DURING_SCREENSHOT = "nextjs-portal { display: none !important; }";
const MASK_COLOR = "#ff00ff";
const VERCEL_HOST = "vercel.com";
const BYPASS_HEADER = "x-vercel-protection-bypass";
const SET_BYPASS_COOKIE_HEADER = "x-vercel-set-bypass-cookie";
const SET_BYPASS_COOKIE_VALUE = "true";
const BYPASS_SETTINGS =
  "Vercel → the project → Settings → Deployment Protection → Protection Bypass for Automation";
const DYNAMIC_SEGMENT = /\[[^\]]+\]/;
const CONFIG_FILE = "scripts/screenshots/config.ts";
const LOCAL_ENV = "local";
const DISCOVERY_VIEWPORT = { width: 1280, height: 800 };

type OnEvent = (event: CaptureEvent) => void;

type Session = {
  env: Env;
  params: RunParams;
  context: BrowserContext;
  onEvent: OnEvent;
  signIn: () => Promise<void>;
  samples: Map<string, Promise<string>>;
};

type RunState = { fatal: unknown };

function targetsFor(page: string, params: RunParams): Target[] {
  const sections = params.sections
    ? (pageConfig(page)?.sections ?? []).map((selector) => ({
        kind: "scroll" as const,
        selector,
      }))
    : [];
  return [...params.targets, ...sections];
}

export function shotsFor(params: RunParams): Shot[] {
  return params.envs.flatMap((env) =>
    params.paths.flatMap((page) =>
      params.modes.flatMap((mode): Shot[] =>
        mode === "print"
          ? [
              {
                env,
                page,
                target: { kind: "fullPage" },
                mode,
                width: PRINT_WIDTH,
              },
            ]
          : targetsFor(page, params).flatMap((target) =>
              params.widths.map((width) => ({
                env,
                page,
                target,
                mode,
                width,
              })),
            ),
      ),
    ),
  );
}

function errorMessage(error: unknown) {
  return (error instanceof Error ? error.message : String(error)).split(
    "\n",
  )[0];
}

async function assertReachable(env: Env) {
  try {
    await fetch(env.baseUrl, {
      redirect: "manual",
      signal: AbortSignal.timeout(REACHABILITY_TIMEOUT_MS),
    });
  } catch {
    throw new ScreenshotError(
      env.name === LOCAL_ENV
        ? `${env.baseUrl} is not reachable. Start the dev server with \`npm run dev\`.`
        : `${env.baseUrl} (${env.name}) is not reachable`,
    );
  }
}

function bypassMessage(env: Env) {
  return env.bypassSecret
    ? `${env.baseUrl} rejected ${BYPASS_SECRET_VARIABLE} from ${env.envFile}. Check it against ${BYPASS_SETTINGS}.`
    : `${env.baseUrl} is behind Vercel Deployment Protection. Create a secret in ${BYPASS_SETTINGS}, then set ${BYPASS_SECRET_VARIABLE} in ${env.envFile}.`;
}

async function open(page: Page, path: string, session: Session) {
  const { env } = session;
  const response = await page.goto(new URL(path, env.baseUrl).href, {
    waitUntil: "load",
  });
  await page
    .waitForLoadState("networkidle", { timeout: NETWORK_IDLE_TIMEOUT_MS })
    .catch(() => null);
  const url = new URL(page.url());
  if (
    url.hostname === VERCEL_HOST ||
    url.hostname.endsWith(`.${VERCEL_HOST}`)
  ) {
    throw new ScreenshotError(bypassMessage(env));
  }
  if (response && response.status() >= ERROR_STATUS) {
    session.onEvent({
      kind: "warning",
      message: `${env.name} ${path} answered ${response.status()}`,
    });
  }
  return (
    url.pathname === LOGIN_PATH &&
    new URL(path, env.baseUrl).pathname !== LOGIN_PATH
  );
}

async function signIn(session: Session) {
  const { env, context, onEvent } = session;
  if (!env.credentials) {
    throw new ScreenshotError(
      `This page needs a signed-in user: set ${env.credentialVariables}`,
    );
  }
  onEvent({
    kind: "info",
    message: `Signing in to ${env.name} as ${env.role}…`,
  });
  const page = await context.newPage();
  try {
    await open(page, loginPath(HOME_PATH), session);
    await page.locator(EMAIL_INPUT).fill(env.credentials.email);
    await page.locator(PASSWORD_INPUT).fill(env.credentials.password);
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
        `Sign-in to ${env.name} did not finish within ${LOGIN_TIMEOUT_MS}ms`,
      );
    }
    if (outcome === "invalid") {
      throw new ScreenshotError(
        `Sign-in to ${env.name} failed: ${INVALID_CREDENTIALS_MESSAGE}. Check ${env.credentialVariables}.`,
      );
    }
    if (new URL(page.url()).pathname === CHANGE_PASSWORD_PATH) {
      throw new ScreenshotError(
        `The ${env.name} user must change their password first. Sign in once in a browser to change it.`,
      );
    }
    await mkdir(dirname(env.storageStatePath), { recursive: true });
    await writeFile(
      env.storageStatePath,
      JSON.stringify(await context.storageState()),
      { mode: STORAGE_STATE_FILE_MODE },
    );
  } finally {
    await page.close();
  }
}

async function openSignedIn(page: Page, path: string, session: Session) {
  const redirectedToLogin = await open(page, path, session);
  if (!redirectedToLogin || session.params.signedOut) {
    return;
  }
  await session.signIn();
  if (await open(page, path, session)) {
    throw new ScreenshotError(
      `${path} still redirects to ${LOGIN_PATH} after signing in to ${session.env.name}`,
    );
  }
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

async function discover(sample: SampleLink, session: Session) {
  const page = await session.context.newPage();
  try {
    await page.setViewportSize(DISCOVERY_VIEWPORT);
    await openSignedIn(page, sample.from, session);
    const href = await page
      .locator(sample.link)
      .first()
      .getAttribute("href", { timeout: SELECTOR_TIMEOUT_MS })
      .catch(() => null);
    if (!href) {
      throw new Error(
        `no link matches ${sample.link} on ${sample.from} in ${session.env.name}: pass a real path instead`,
      );
    }
    const url = new URL(href, session.env.baseUrl);
    return `${url.pathname}${url.search}`;
  } finally {
    await page.close();
  }
}

function resolvePath(pattern: string, session: Session) {
  if (!DYNAMIC_SEGMENT.test(pattern)) {
    return Promise.resolve(pattern);
  }
  const sample = pageConfig(pattern)?.sample;
  if (!sample) {
    return Promise.reject(
      new Error(
        `${pattern} has a dynamic segment: pass a real path or add a sample to ${CONFIG_FILE}`,
      ),
    );
  }
  const known = session.samples.get(pattern);
  if (known) {
    return known;
  }
  const discovered = discover(sample, session);
  session.samples.set(pattern, discovered);
  return discovered;
}

async function captureShot(
  page: Page,
  shot: Shot,
  file: string,
  session: Session,
) {
  const { params } = session;
  const path = await resolvePath(shot.page, session);
  await page.setViewportSize({ width: shot.width, height: params.height });
  await page.emulateMedia({
    media: shot.mode === "print" ? "print" : "screen",
    colorScheme: shot.mode === "print" ? "light" : shot.mode,
  });
  await openSignedIn(page, path, session);
  const config = pageConfig(shot.page);
  const waitFor = params.waitFor ?? config?.waitFor;
  if (waitFor) {
    await firstMatch(page, waitFor);
  }
  await page.evaluate(() => document.fonts.ready);
  const options = {
    path: file,
    animations: "disabled" as const,
    style: HIDDEN_DURING_SCREENSHOT,
    mask: [...params.masks, ...(config?.masks ?? [])].map((selector) =>
      page.locator(selector),
    ),
    maskColor: MASK_COLOR,
  };
  const { target } = shot;
  if (target.kind === "viewport" || target.kind === "fullPage") {
    await page.screenshot({ ...options, fullPage: target.kind === "fullPage" });
    return path;
  }
  const locator = await firstMatch(page, target.selector);
  if (target.kind === "element") {
    await locator.screenshot(options);
    return path;
  }
  await locator.evaluate((element) =>
    element.scrollIntoView({ block: "start", behavior: "instant" }),
  );
  await page.screenshot(options);
  return path;
}

async function openSession(
  browser: Browser,
  env: Env,
  params: RunParams,
  onEvent: OnEvent,
): Promise<Session> {
  const context = await browser.newContext({
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    ...(!params.signedOut && existsSync(env.storageStatePath)
      ? { storageState: env.storageStatePath }
      : {}),
  });
  context.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS);
  const secret = env.bypassSecret;
  if (secret) {
    await context.route(
      (url) => url.origin === env.baseUrl,
      (route) =>
        route.continue({
          headers: {
            ...route.request().headers(),
            [BYPASS_HEADER]: secret,
            [SET_BYPASS_COOKIE_HEADER]: SET_BYPASS_COOKIE_VALUE,
          },
        }),
    );
  }
  if (env.fixedClock && params.clock) {
    await context.clock.setFixedTime(new Date(params.clock));
  }
  let signingIn: Promise<void> | null = null;
  const session: Session = {
    env,
    params,
    context,
    onEvent,
    signIn: () => (signingIn ??= signIn(session)),
    samples: new Map(),
  };
  return session;
}

function record(manifest: Manifest, result: ShotResult, order: Shot[]) {
  manifest.shots.push(result);
  manifest.shots.sort(
    (a, b) =>
      order.findIndex((shot) => shotFile(shot) === a.file) -
      order.findIndex((shot) => shotFile(shot) === b.file),
  );
  writeManifest(manifest);
}

async function captureEnv(
  browser: Browser,
  env: Env,
  manifest: Manifest,
  shots: Shot[],
  state: RunState,
  onEvent: OnEvent,
) {
  const envShots = shots.filter((shot) => shot.env === env.name);
  const session = await openSession(browser, env, manifest.params, onEvent);
  let next = 0;
  const worker = async () => {
    const page = await session.context.newPage();
    page.on("pageerror", (error) =>
      onEvent({
        kind: "warning",
        message: `${env.name} ${page.url()}: ${errorMessage(error)}`,
      }),
    );
    for (
      let shot = envShots[next++];
      shot && !state.fatal;
      shot = envShots[next++]
    ) {
      const file = shotFile(shot);
      try {
        const path = await captureShot(
          page,
          shot,
          shotPath(manifest.id, file),
          session,
        );
        const result = { ...shot, path, file, error: null };
        record(manifest, result, shots);
        onEvent({ kind: "shot", result });
      } catch (error) {
        if (error instanceof ScreenshotError) {
          state.fatal ??= error;
          return;
        }
        const result = {
          ...shot,
          path: null,
          file,
          error: errorMessage(error),
        };
        record(manifest, result, shots);
        onEvent({ kind: "shot", result });
      }
    }
  };
  try {
    await Promise.all(
      Array.from(
        { length: Math.min(manifest.params.concurrency, envShots.length) },
        worker,
      ),
    );
  } finally {
    await session.context.close();
  }
}

export async function prepareRun(name: string | null, params: RunParams) {
  const envs = params.envs.map((env) => loadEnv(env, params.as));
  await Promise.all(envs.map(assertReachable));
  return createRun(
    name,
    params,
    Object.fromEntries(envs.map(({ name, baseUrl }) => [name, baseUrl])),
    shotsFor(params).length,
  );
}

export async function executeRun(manifest: Manifest, onEvent: OnEvent) {
  const shots = shotsFor(manifest.params);
  const state: RunState = { fatal: null };
  try {
    const browser = await chromium.launch();
    try {
      for (const env of manifest.params.envs.map((name) =>
        loadEnv(name, manifest.params.as),
      )) {
        if (state.fatal) {
          break;
        }
        await captureEnv(browser, env, manifest, shots, state, onEvent);
      }
    } finally {
      await browser.close();
    }
  } catch (error) {
    state.fatal ??= error;
  }
  manifest.status = state.fatal ? "failed" : "done";
  manifest.error = state.fatal ? errorMessage(state.fatal) : null;
  manifest.finishedAt = new Date().toISOString();
  writeManifest(manifest);
  await cleanRuns(KEPT_UNNAMED_RUNS, false);
  if (state.fatal) {
    throw state.fatal;
  }
  return manifest;
}
