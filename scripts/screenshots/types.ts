import type { EnvName, Mode, Role } from "./config";

export type Target =
  | { kind: "viewport" }
  | { kind: "fullPage" }
  | { kind: "scroll"; selector: string }
  | { kind: "element"; selector: string };

export type RunParams = {
  paths: string[];
  envs: EnvName[];
  widths: number[];
  height: number;
  modes: Mode[];
  targets: Target[];
  sections: boolean;
  masks: string[];
  waitFor: string | null;
  signedOut: boolean;
  as: Role;
  concurrency: number;
  clock: string | null;
};

export type Shot = {
  env: EnvName;
  page: string;
  target: Target;
  mode: Mode;
  width: number;
};

export type ShotResult = Shot & {
  path: string | null;
  file: string;
  error: string | null;
};

export type GitState = { sha: string | null; dirty: boolean };

export type Manifest = {
  id: string;
  name: string | null;
  status: "running" | "done" | "failed";
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
  git: GitState;
  baseUrls: Partial<Record<EnvName, string>>;
  params: RunParams;
  total: number;
  shots: ShotResult[];
};

export type Side = { run: string; env: EnvName };

export type ComparedShot = {
  key: string;
  label: string;
  width: number;
  a: string | null;
  b: string | null;
  diff: string | null;
  mismatch: number | null;
};

export type CompareReport = {
  id: string;
  a: Side;
  b: Side;
  createdAt: string;
  shots: ComparedShot[];
};

export type CaptureEvent =
  | { kind: "info"; message: string }
  | { kind: "warning"; message: string }
  | { kind: "shot"; result: ShotResult };
