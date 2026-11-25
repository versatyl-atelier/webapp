import pkg from "@/../package.json";
import {
  LOCAL_ENVIRONMENT,
  VERSION_REVEAL_TAP_COUNT,
  VERSION_REVEAL_TAP_WINDOW_MS,
} from "@/constants/version";

export type VersionInfo = {
  version: string;
  commitSha: string | null;
  environment: string;
};

export function getVersionInfo(
  env: Record<string, string | undefined>,
): VersionInfo {
  return {
    version: pkg.version,
    commitSha: env.VERCEL_GIT_COMMIT_SHA || null,
    environment: env.VERCEL_ENV || LOCAL_ENVIRONMENT,
  };
}

export type TapStreak = {
  count: number;
  lastTapAt: number;
};

export const EMPTY_TAP_STREAK: TapStreak = { count: 0, lastTapAt: 0 };

export function registerTap(
  streak: TapStreak,
  now: number,
): { streak: TapStreak; isComplete: boolean } {
  const isContinued =
    streak.count > 0 && now - streak.lastTapAt <= VERSION_REVEAL_TAP_WINDOW_MS;
  const count = isContinued ? streak.count + 1 : 1;
  if (count >= VERSION_REVEAL_TAP_COUNT) {
    return { streak: EMPTY_TAP_STREAK, isComplete: true };
  }
  return { streak: { count, lastTapAt: now }, isComplete: false };
}
