import { describe, it, expect, vi, afterEach } from "vitest";

import {
  parseTimeToSeconds,
  hoursToSeconds,
  secondsToHours,
  formatTimeDisplay,
  getThisWeek,
  getMonday,
  getMondayOfDate,
  isSameDay,
  isSameUTCDate,
  toUTCDate,
} from "@/lib/time";

describe("parseTimeToSeconds", () => {
  it("treats a number below 100 as hours", () => {
    expect(parseTimeToSeconds(2.5)).toBe(9000);
  });

  it("treats a number of 100 or more as seconds", () => {
    expect(parseTimeToSeconds(150)).toBe(150);
  });

  it("parses combined unit strings", () => {
    expect(parseTimeToSeconds("1h30m")).toBe(5400);
    expect(parseTimeToSeconds("1h 30m 15s")).toBe(5415);
    expect(parseTimeToSeconds("45s")).toBe(45);
    expect(parseTimeToSeconds("30m")).toBe(1800);
  });

  it("parses the 'Xh Y' shorthand as hours + minutes", () => {
    expect(parseTimeToSeconds("5h 56")).toBe(21360);
    expect(parseTimeToSeconds("5h56")).toBe(21360);
  });

  it("parses HH:MM and HH:MM:SS", () => {
    expect(parseTimeToSeconds("2:30")).toBe(9000);
    expect(parseTimeToSeconds("1:02:03")).toBe(3723);
  });

  it("parses a decimal string as hours", () => {
    expect(parseTimeToSeconds("2.5")).toBe(9000);
  });

  it("treats a decimal string of 100 or more as seconds", () => {
    expect(parseTimeToSeconds("150")).toBe(150);
  });

  it("returns 0 for unparseable input", () => {
    expect(parseTimeToSeconds("abc")).toBe(0);
    expect(parseTimeToSeconds("")).toBe(0);
  });
});

describe("hoursToSeconds / secondsToHours", () => {
  it("round-trips", () => {
    expect(hoursToSeconds(1)).toBe(3600);
    expect(secondsToHours(3600)).toBe(1);
  });
});

describe("formatTimeDisplay", () => {
  it("formats a decimal number of hours", () => {
    expect(formatTimeDisplay(2.5)).toBe("2h 30m");
  });

  it("carries minutes into hours when rounding hits 60", () => {
    expect(formatTimeDisplay(2.999)).toBe("3h 0m");
  });

  it("falls back to 0h 0m for 0 or NaN", () => {
    expect(formatTimeDisplay(0)).toBe("0h 0m");
    expect(formatTimeDisplay(NaN)).toBe("0h 0m");
  });
});

describe("getMondayOfDate", () => {
  it("returns the same date when given a Monday", () => {
    const monday = new Date(2024, 0, 8);
    const result = getMondayOfDate(monday);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(8);
    expect(result.getHours()).toBe(0);
  });

  it("goes back to Monday for a mid-week date", () => {
    const wednesday = new Date(2024, 0, 10);
    const result = getMondayOfDate(wednesday);
    expect(result.getDate()).toBe(8);
  });

  it("goes back to Monday of the same week for a Sunday", () => {
    const sunday = new Date(2024, 0, 14);
    const result = getMondayOfDate(sunday);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(8);
  });
});

describe("getMonday / getThisWeek", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("getMonday(0) returns the Monday of the current week", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 10));
    const result = getMonday();
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(8);
  });

  it("getMonday(weekOffset) shifts by full weeks", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 10));
    expect(getMonday(1).getDate()).toBe(15);
    expect(getMonday(-1).getDate()).toBe(1);
  });

  it("getThisWeek returns Monday 00:00 through Sunday 23:59:59.999", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 10));
    const { startDate, endDate } = getThisWeek();
    expect(startDate.getDate()).toBe(8);
    expect(startDate.getHours()).toBe(0);
    expect(endDate.getDate()).toBe(14);
    expect(endDate.getHours()).toBe(23);
    expect(endDate.getMinutes()).toBe(59);
  });
});

describe("isSameDay", () => {
  it("is true for the same calendar day at different times", () => {
    expect(isSameDay(new Date(2024, 0, 8, 1), new Date(2024, 0, 8, 23))).toBe(
      true,
    );
  });

  it("is false for different calendar days", () => {
    expect(isSameDay(new Date(2024, 0, 8), new Date(2024, 0, 9))).toBe(false);
  });
});

describe("isSameUTCDate", () => {
  it("is true for the same UTC calendar day", () => {
    const a = new Date(Date.UTC(2024, 0, 8, 1));
    const b = new Date(Date.UTC(2024, 0, 8, 23));
    expect(isSameUTCDate(a, b)).toBe(true);
  });

  it("is false for different UTC calendar days", () => {
    const a = new Date(Date.UTC(2024, 0, 8, 23));
    const b = new Date(Date.UTC(2024, 0, 9, 1));
    expect(isSameUTCDate(a, b)).toBe(false);
  });
});

describe("toUTCDate", () => {
  it("preserves the local Y/M/D at UTC midnight", () => {
    const local = new Date(2024, 0, 15, 18, 30);
    const result = toUTCDate(local);
    expect(result.getUTCFullYear()).toBe(2024);
    expect(result.getUTCMonth()).toBe(0);
    expect(result.getUTCDate()).toBe(15);
    expect(result.getUTCHours()).toBe(0);
  });
});
