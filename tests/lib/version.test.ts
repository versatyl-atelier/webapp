import { describe, expect, it } from "vitest";

import pkg from "@/../package.json";
import {
  LOCAL_ENVIRONMENT,
  VERSION_REVEAL_TAP_COUNT,
  VERSION_REVEAL_TAP_WINDOW_MS,
} from "@/constants/version";
import {
  EMPTY_TAP_STREAK,
  getVersionInfo,
  registerTap,
  type TapStreak,
} from "@/lib/version";

function tapAt(times: number[]) {
  let streak: TapStreak = EMPTY_TAP_STREAK;
  let isComplete = false;
  for (const time of times) {
    ({ streak, isComplete } = registerTap(streak, time));
  }
  return { streak, isComplete };
}

const quickTaps = (count: number) =>
  Array.from({ length: count }, (_, i) => 1000 + i * 100);

describe("getVersionInfo", () => {
  it("reads the commit and environment from Vercel", () => {
    expect(
      getVersionInfo({
        VERCEL_GIT_COMMIT_SHA: "abc123",
        VERCEL_ENV: "preview",
      }),
    ).toEqual({
      version: pkg.version,
      commitSha: "abc123",
      environment: "preview",
    });
  });

  it("falls back outside Vercel", () => {
    expect(getVersionInfo({})).toEqual({
      version: pkg.version,
      commitSha: null,
      environment: LOCAL_ENVIRONMENT,
    });
  });
});

describe("registerTap", () => {
  it("completes after enough quick taps", () => {
    expect(tapAt(quickTaps(VERSION_REVEAL_TAP_COUNT)).isComplete).toBe(true);
  });

  it("doesn't complete one tap short", () => {
    const { streak, isComplete } = tapAt(
      quickTaps(VERSION_REVEAL_TAP_COUNT - 1),
    );
    expect(isComplete).toBe(false);
    expect(streak.count).toBe(VERSION_REVEAL_TAP_COUNT - 1);
  });

  it("starts over after a slow tap", () => {
    const taps = quickTaps(VERSION_REVEAL_TAP_COUNT - 1);
    const lastTap = taps[taps.length - 1];
    const { streak } = tapAt([
      ...taps,
      lastTap + VERSION_REVEAL_TAP_WINDOW_MS + 1,
    ]);
    expect(streak.count).toBe(1);
  });

  it("resets after completing", () => {
    expect(tapAt(quickTaps(VERSION_REVEAL_TAP_COUNT)).streak).toEqual(
      EMPTY_TAP_STREAK,
    );
  });
});
