import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

import { COMPARES_DIR } from "./config";
import { ScreenshotError, isEnvName } from "./envs";
import { formatMismatch, renderCompare } from "./html";
import { INDEX_FILE, resolveRun, shotPath } from "./runs";
import { shotKey, shotLabel } from "./shots";
import type {
  ComparedShot,
  CompareReport,
  Manifest,
  ShotResult,
  Side,
} from "./types";

const SIDE_SEPARATOR = ":";
const SIDE_PART_SEPARATOR = ".";
const COMPARE_ID_SEPARATOR = "--";
const REPORT_FILE = "report.json";
const DIFF_THRESHOLD = 0.1;
const PERCENT = 100;
const JSON_INDENT = 2;
const SUMMARY_INDENT = "  ";
const DETAIL_INDENT = "           ";
const MISMATCH_COLUMN_WIDTH = 8;

type ResolvedSide = { side: Side; manifest: Manifest };

export async function resolveSide(ref: string): Promise<ResolvedSide> {
  const [runRef = ref, env] = ref.split(SIDE_SEPARATOR);
  const manifest = await resolveRun(runRef);
  const { envs } = manifest.params;
  if (env !== undefined) {
    if (!isEnvName(env) || !envs.includes(env)) {
      throw new ScreenshotError(
        `Run ${manifest.id} has no ${env} shots (it has ${envs.join(", ")})`,
      );
    }
    return { side: { run: manifest.id, env }, manifest };
  }
  const [onlyEnv] = envs;
  if (!onlyEnv || envs.length > 1) {
    throw new ScreenshotError(
      `Run ${manifest.id} has several envs (${envs.join(", ")}): use ${manifest.id}${SIDE_SEPARATOR}<env>`,
    );
  }
  return { side: { run: manifest.id, env: onlyEnv }, manifest };
}

function padded(png: PNG, width: number, height: number) {
  if (png.width === width && png.height === height) {
    return png;
  }
  const output = new PNG({ width, height });
  PNG.bitblt(png, output, 0, 0, png.width, png.height, 0, 0);
  return output;
}

function compareImages(fileA: string, fileB: string, diffFile: string) {
  const a = PNG.sync.read(readFileSync(fileA));
  const b = PNG.sync.read(readFileSync(fileB));
  const width = Math.max(a.width, b.width);
  const height = Math.max(a.height, b.height);
  const diff = new PNG({ width, height });
  const mismatched = pixelmatch(
    padded(a, width, height).data,
    padded(b, width, height).data,
    diff.data,
    width,
    height,
    { threshold: DIFF_THRESHOLD },
  );
  if (mismatched > 0) {
    writeFileSync(diffFile, PNG.sync.write(diff));
  }
  return (mismatched / (width * height)) * PERCENT;
}

function successfulShots({ side, manifest }: ResolvedSide) {
  return new Map(
    manifest.shots
      .filter((shot) => shot.env === side.env && !shot.error)
      .map((shot): [string, ShotResult] => [shotKey(shot), shot]),
  );
}

function rank({ mismatch }: ComparedShot) {
  return mismatch ?? Number.POSITIVE_INFINITY;
}

function compareId(a: Side, b: Side) {
  return [a, b]
    .map(({ run, env }) => `${run}${SIDE_PART_SEPARATOR}${env}`)
    .join(COMPARE_ID_SEPARATOR);
}

export async function compareSides(refA: string, refB: string) {
  const resolvedA = await resolveSide(refA);
  const resolvedB = await resolveSide(refB);
  const id = compareId(resolvedA.side, resolvedB.side);
  const dir = resolve(COMPARES_DIR, id);
  await rm(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const shotsA = successfulShots(resolvedA);
  const shotsB = successfulShots(resolvedB);
  const keys = [...new Set([...shotsA.keys(), ...shotsB.keys()])];
  const shots = keys
    .flatMap((key): ComparedShot[] => {
      const shotA = shotsA.get(key);
      const shotB = shotsB.get(key);
      const source = shotA ?? shotB;
      if (!source) {
        return [];
      }
      const a = shotA ? shotPath(resolvedA.side.run, shotA.file) : null;
      const b = shotB ? shotPath(resolvedB.side.run, shotB.file) : null;
      const shot = { key, label: shotLabel(source), width: source.width, a, b };
      if (!a || !b) {
        return [{ ...shot, diff: null, mismatch: null }];
      }
      const diff = join(dir, key);
      const mismatch = compareImages(a, b, diff);
      return [{ ...shot, diff: mismatch > 0 ? diff : null, mismatch }];
    })
    .sort((x, y) => rank(y) - rank(x) || x.label.localeCompare(y.label));
  const report: CompareReport = {
    id,
    a: resolvedA.side,
    b: resolvedB.side,
    createdAt: new Date().toISOString(),
    shots,
  };
  writeFileSync(
    join(dir, REPORT_FILE),
    JSON.stringify(report, null, JSON_INDENT),
  );
  writeFileSync(
    join(dir, INDEX_FILE),
    renderCompare(report, (file) => relative(dir, file)),
  );
  return { report, index: join(dir, INDEX_FILE) };
}

export function compareSummary(report: CompareReport, index: string) {
  const changed = report.shots.filter(({ mismatch }) => mismatch !== 0);
  const missing = changed.filter(({ mismatch }) => mismatch === null);
  const lines = changed.flatMap((shot) => [
    `${SUMMARY_INDENT}${formatMismatch(shot.mismatch).padStart(MISMATCH_COLUMN_WIDTH)} ${shot.label}`,
    ...(shot.diff ? [`${DETAIL_INDENT}diff   ${shot.diff}`] : []),
    `${DETAIL_INDENT}before ${shot.a ?? "none"}`,
    `${DETAIL_INDENT}after  ${shot.b ?? "none"}`,
  ]);
  return [
    `${report.a.run}:${report.a.env} → ${report.b.run}:${report.b.env}: ${report.shots.length} shots, ${changed.length - missing.length} different, ${missing.length} missing on one side, ${report.shots.length - changed.length} identical`,
    ...lines,
    index,
  ].join("\n");
}
