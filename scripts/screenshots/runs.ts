import { execFile } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { readdir, rm } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { promisify } from "node:util";

import { RUNS_DIR, type EnvName } from "./config";
import { ScreenshotError } from "./envs";
import { renderRunSheet } from "./html";
import type { GitState, Manifest, RunParams } from "./types";

const MANIFEST_FILE = "manifest.json";
export const INDEX_FILE = "index.html";
const LATEST_RUN = "latest";
const RUN_NAME_PATTERN = /^[a-z0-9][a-z0-9._-]*$/i;
const TIMESTAMP_LOCALE = "sv-SE";
const TIMESTAMP_SEPARATORS = /[ :]/g;
const TIMESTAMP_SEPARATOR = "-";
const JSON_INDENT = 2;

const execFileAsync = promisify(execFile);

export function runDir(id: string) {
  return resolve(RUNS_DIR, id);
}

export function shotPath(id: string, file: string) {
  return join(runDir(id), file);
}

async function gitState(): Promise<GitState> {
  try {
    const [{ stdout: sha }, { stdout: status }] = await Promise.all([
      execFileAsync("git", ["rev-parse", "HEAD"]),
      execFileAsync("git", ["status", "--porcelain"]),
    ]);
    return { sha: sha.trim(), dirty: status.trim().length > 0 };
  } catch {
    return { sha: null, dirty: false };
  }
}

function timestampId(date: Date) {
  return date
    .toLocaleString(TIMESTAMP_LOCALE)
    .replace(TIMESTAMP_SEPARATORS, TIMESTAMP_SEPARATOR);
}

export function assertRunName(name: string) {
  if (!RUN_NAME_PATTERN.test(name) || name === LATEST_RUN) {
    throw new ScreenshotError(
      `Invalid run name "${name}": use letters, digits, ".", "_" and "-", and not "${LATEST_RUN}"`,
    );
  }
}

export function writeManifest(manifest: Manifest) {
  const dir = runDir(manifest.id);
  writeFileSync(
    join(dir, MANIFEST_FILE),
    JSON.stringify(manifest, null, JSON_INDENT),
  );
  writeFileSync(
    join(dir, INDEX_FILE),
    renderRunSheet(manifest, (result) => result.file),
  );
}

export async function createRun(
  name: string | null,
  params: RunParams,
  baseUrls: Partial<Record<EnvName, string>>,
  total: number,
): Promise<Manifest> {
  const startedAt = new Date();
  if (name) {
    assertRunName(name);
  }
  const id = name ?? timestampId(startedAt);
  const dir = runDir(id);
  await rm(dir, { recursive: true, force: true });
  params.envs.forEach((env) => mkdirSync(join(dir, env), { recursive: true }));
  const manifest: Manifest = {
    id,
    name,
    status: "running",
    error: null,
    startedAt: startedAt.toISOString(),
    finishedAt: null,
    git: await gitState(),
    baseUrls,
    params,
    total,
    shots: [],
  };
  writeManifest(manifest);
  return manifest;
}

export function readManifest(id: string): Manifest {
  const file = join(runDir(id), MANIFEST_FILE);
  if (!existsSync(file)) {
    throw new ScreenshotError(`No run named "${id}" in ${RUNS_DIR}`);
  }
  const manifest: Manifest = JSON.parse(readFileSync(file, "utf8"));
  return manifest;
}

export async function listRuns(): Promise<Manifest[]> {
  if (!existsSync(RUNS_DIR)) {
    return [];
  }
  const entries = await readdir(RUNS_DIR, { withFileTypes: true });
  return entries
    .filter(
      (entry) =>
        entry.isDirectory() &&
        existsSync(join(RUNS_DIR, entry.name, MANIFEST_FILE)),
    )
    .map((entry) => readManifest(entry.name))
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export async function resolveRun(ref: string) {
  if (ref !== LATEST_RUN) {
    return readManifest(ref);
  }
  const [latest] = await listRuns();
  if (!latest) {
    throw new ScreenshotError(`No runs in ${RUNS_DIR} yet`);
  }
  return latest;
}

export async function cleanRuns(keep: number, named: boolean) {
  const runs = (await listRuns()).filter(({ name }) => named || name === null);
  const removed = runs.slice(keep);
  await Promise.all(
    removed.map(({ id }) => rm(runDir(id), { recursive: true, force: true })),
  );
  return removed.map(({ id }) => relative(process.cwd(), runDir(id)));
}
