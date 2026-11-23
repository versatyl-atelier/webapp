import { execFile } from "node:child_process";
import { dirname } from "node:path";
import { promisify } from "node:util";

import { isWithinPath } from "@/lib/paths";

import {
  ALL_PRESET,
  DEFAULT_CONCURRENCY,
  DEFAULT_ENV,
  DEFAULT_HEIGHT,
  DEFAULT_MODES,
  DEFAULT_ROLE,
  DEFAULT_WIDTHS,
  ENVS,
  MODES,
  PAGES,
  PRESETS,
  ROLES,
  type EnvName,
  type Mode,
} from "./config";
import { ScreenshotError, isEnvName } from "./envs";
import type { RunParams, Target } from "./types";

const LIST_SEPARATOR = ",";
const ALL_MODES = "all";
const NO_CLOCK = "none";
const SRC_DIR = "src/";
const APP_DIR = "src/app";
const PATH_SEPARATOR = "/";
const INTERCEPTION_MARKERS = /^(\(\.{1,3}\))+/;
const ROUTE_GROUP = /^\(.*\)$/;
const SLOT_PREFIX = "@";
const LINE_BREAK = /\r?\n/;

const execFileAsync = promisify(execFile);

export type ParamsInput = {
  paths?: string[];
  presets?: string[];
  changedSince?: string;
  widths?: string;
  height?: string;
  modes?: string;
  envs?: string;
  fullPage?: boolean;
  scroll?: string[];
  element?: string[];
  sections?: boolean;
  masks?: string[];
  waitFor?: string;
  signedOut?: boolean;
  as?: string;
  concurrency?: string;
  clock?: string;
};

function roleFrom(value: string) {
  const role = ROLES.find((role) => role === value);
  if (!role) {
    throw new ScreenshotError(
      `Unknown role "${value}", expected ${ROLES.join(" or ")}`,
    );
  }
  return role;
}

function isMode(value: string): value is Mode {
  return MODES.some((mode) => mode === value);
}

function list(value: string) {
  return value
    .split(LIST_SEPARATOR)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function lines(value: string | undefined) {
  return (value ?? "")
    .split(LINE_BREAK)
    .map((line) => line.trim())
    .filter(Boolean);
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

function modesFrom(value: string): Mode[] {
  if (value === ALL_MODES) {
    return [...MODES];
  }
  return list(value).map((mode) => {
    if (!isMode(mode)) {
      throw new ScreenshotError(
        `Unknown mode "${mode}": use ${MODES.join(", ")} or ${ALL_MODES}`,
      );
    }
    return mode;
  });
}

function envsFrom(value: string): EnvName[] {
  return list(value).map((env) => {
    if (!isEnvName(env)) {
      throw new ScreenshotError(
        `Unknown env "${env}": use ${Object.keys(ENVS).join(", ")}`,
      );
    }
    return env;
  });
}

function presetPaths(preset: string) {
  const paths = PRESETS[preset];
  if (!paths) {
    throw new ScreenshotError(
      `Unknown preset "${preset}": use ${Object.keys(PRESETS).join(", ")}`,
    );
  }
  return paths;
}

function routeOf(file: string) {
  const segments = dirname(file)
    .slice(APP_DIR.length)
    .split(PATH_SEPARATOR)
    .map((segment) => segment.replace(INTERCEPTION_MARKERS, ""))
    .filter(
      (segment) =>
        segment &&
        !ROUTE_GROUP.test(segment) &&
        !segment.startsWith(SLOT_PREFIX),
    );
  return `${PATH_SEPARATOR}${segments.join(PATH_SEPARATOR)}`;
}

export async function changedPaths(ref: string) {
  const [{ stdout: changed }, { stdout: untracked }] = await Promise.all([
    execFileAsync("git", ["diff", "--name-only", ref]),
    execFileAsync("git", ["ls-files", "--others", "--exclude-standard"]),
  ]);
  const files = [...lines(changed), ...lines(untracked)].filter((file) =>
    file.startsWith(SRC_DIR),
  );
  if (files.length === 0) {
    throw new ScreenshotError(`No changed files under ${SRC_DIR} since ${ref}`);
  }
  if (files.some((file) => !file.startsWith(`${APP_DIR}${PATH_SEPARATOR}`))) {
    return presetPaths(ALL_PRESET);
  }
  const routes = files.map(routeOf);
  return PAGES.map(({ path }) => path).filter((path) =>
    routes.some((route) => isWithinPath(path, route)),
  );
}

function normalizePath(path: string) {
  return path.startsWith(PATH_SEPARATOR) ? path : `${PATH_SEPARATOR}${path}`;
}

function targetsFrom(input: ParamsInput, base: RunParams | null): Target[] {
  const targets: Target[] = [
    ...(input.scroll ?? []).map((selector) => ({
      kind: "scroll" as const,
      selector,
    })),
    ...(input.element ?? []).map((selector) => ({
      kind: "element" as const,
      selector,
    })),
  ];
  if (input.fullPage && targets.length > 0) {
    throw new ScreenshotError(
      "Full page cannot be combined with scroll or element targets",
    );
  }
  if (targets.length > 0) {
    return targets;
  }
  if (input.fullPage !== undefined || !base) {
    return [{ kind: input.fullPage ? "fullPage" : "viewport" }];
  }
  return base.targets;
}

function clockFrom(value: string | undefined, base: RunParams | null) {
  if (value === NO_CLOCK) {
    return null;
  }
  if (value === undefined) {
    return base ? base.clock : new Date().toISOString();
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ScreenshotError(
      `Invalid clock "${value}": use an ISO date or ${NO_CLOCK}`,
    );
  }
  return date.toISOString();
}

export async function buildParams(
  input: ParamsInput,
  base: RunParams | null,
): Promise<RunParams> {
  const requested = [
    ...(input.paths ?? []),
    ...(input.presets ?? []).flatMap(presetPaths),
    ...(input.changedSince ? await changedPaths(input.changedSince) : []),
  ].map(normalizePath);
  const paths = requested.length > 0 ? [...new Set(requested)] : base?.paths;
  if (!paths || paths.length === 0) {
    throw new ScreenshotError("Pick at least one page, preset or --changed");
  }
  const modes = input.modes ? modesFrom(input.modes) : base?.modes;
  const envs = input.envs ? envsFrom(input.envs) : base?.envs;
  return {
    paths,
    envs: envs?.length ? envs : [DEFAULT_ENV],
    widths: input.widths
      ? list(input.widths).map((width) => positiveInteger(width, "Widths"))
      : (base?.widths ?? DEFAULT_WIDTHS),
    height: input.height
      ? positiveInteger(input.height, "Height")
      : (base?.height ?? DEFAULT_HEIGHT),
    modes: modes?.length ? modes : DEFAULT_MODES,
    targets: targetsFrom(input, base),
    sections: input.sections ?? base?.sections ?? false,
    masks: input.masks?.length ? input.masks : (base?.masks ?? []),
    waitFor: input.waitFor || (base?.waitFor ?? null),
    signedOut: input.signedOut ?? base?.signedOut ?? false,
    as: input.as ? roleFrom(input.as) : (base?.as ?? DEFAULT_ROLE),
    concurrency: input.concurrency
      ? positiveInteger(input.concurrency, "Concurrency")
      : (base?.concurrency ?? DEFAULT_CONCURRENCY),
    clock: clockFrom(input.clock, base),
  };
}
