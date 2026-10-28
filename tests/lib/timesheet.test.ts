import { describe, expect, it } from "vitest";

import { PAY_PERIOD_COUNT, type TimesheetPeriod } from "@/constants/timesheet";
import {
  buildTimesheet,
  isoWeekNumber,
  localDateKeyOf,
  parsePeriod,
  payPeriodEnds,
  periodWeekStarts,
  type TimesheetSource,
} from "@/lib/timesheet";

const TODAY = "2026-10-28";

describe("parsePeriod", () => {
  it("accepts the known periods and falls back to the current week", () => {
    expect(parsePeriod("last2")).toBe("last2");
    expect(parsePeriod(["pay", "last"])).toBe("pay");
    expect(parsePeriod("month")).toBe("current");
    expect(parsePeriod(undefined)).toBe("current");
  });
});

describe("periodWeekStarts", () => {
  const weeks = (period: TimesheetPeriod, payEnd = "2026-11-01") =>
    periodWeekStarts(period, TODAY, payEnd);

  it("returns the Monday of each week of the period", () => {
    expect(weeks("current")).toEqual(["2026-10-26"]);
    expect(weeks("last")).toEqual(["2026-10-19"]);
    expect(weeks("last2")).toEqual(["2026-10-12", "2026-10-19"]);
  });

  it("ends the pay period on the chosen Sunday", () => {
    expect(weeks("pay", "2026-10-25")).toEqual(["2026-10-12", "2026-10-19"]);
  });

  it("accepts any day of the last week as the end of a pay period", () => {
    expect(weeks("pay", "2026-10-22")).toEqual(["2026-10-12", "2026-10-19"]);
  });
});

describe("payPeriodEnds", () => {
  it("lists Sundays two weeks apart, starting with this week", () => {
    const ends = payPeriodEnds(TODAY);
    expect(ends).toHaveLength(PAY_PERIOD_COUNT);
    expect(ends.slice(0, 3)).toEqual([
      "2026-11-01",
      "2026-10-18",
      "2026-10-04",
    ]);
  });
});

describe("isoWeekNumber", () => {
  it("follows the ISO calendar, including around the new year", () => {
    expect(isoWeekNumber("2026-10-26")).toBe(44);
    expect(isoWeekNumber("2025-12-29")).toBe(1);
    expect(isoWeekNumber("2026-01-05")).toBe(2);
    expect(isoWeekNumber("2024-12-30")).toBe(1);
  });
});

describe("localDateKeyOf", () => {
  it("uses the local calendar day of the date", () => {
    expect(localDateKeyOf(new Date(2026, 9, 5, 23, 59))).toBe("2026-10-05");
    expect(localDateKeyOf(new Date(2026, 0, 31, 0, 0))).toBe("2026-01-31");
  });
});

describe("buildTimesheet", () => {
  const monday = "2026-10-26";
  const hours = (day: number, from: number, to: number) => ({
    employeeId: 1,
    start: new Date(2026, 9, 26 + day, from),
    end: new Date(2026, 9, 26 + day, to),
  });
  const source = (overrides: Partial<TimesheetSource>): TimesheetSource => ({
    weekStarts: [monday],
    employees: [
      { id: 1, name: "Patrice" },
      { id: 2, name: "Sophie" },
    ],
    entries: [],
    objectives: [],
    kilometrages: [],
    frozenWeeks: [],
    defaultObjective: 40,
    ...overrides,
  });

  it("gives every employee a row, even without hours", () => {
    const rows = buildTimesheet(source({}));
    expect(rows.map(({ name }) => name)).toEqual(["Patrice", "Sophie"]);
    expect(rows[1].weeks[0]).toEqual({
      days: [0, 0, 0, 0, 0, 0, 0],
      total: 0,
      objective: 40,
      difference: -40,
      kilometrage: 0,
      frozen: false,
    });
  });

  it("adds the hours of each day and the week total", () => {
    const rows = buildTimesheet(
      source({
        entries: [hours(1, 8, 12), hours(1, 13, 16), hours(2, 8, 10)],
      }),
    );
    expect(rows[0].weeks[0].days).toEqual([0, 7, 2, 0, 0, 0, 0]);
    expect(rows[0].weeks[0].total).toBe(9);
    expect(rows[0].weeks[0].difference).toBe(-31);
  });

  it("ignores running punches and other employees' entries", () => {
    const rows = buildTimesheet(
      source({
        entries: [
          { employeeId: 1, start: new Date(2026, 9, 26, 8), end: null },
          { ...hours(0, 8, 10), employeeId: 2 },
        ],
      }),
    );
    expect(rows[0].weeks[0].total).toBe(0);
    expect(rows[1].weeks[0].total).toBe(2);
  });

  it("uses the saved objective, kilometrage and frozen state of that week", () => {
    const weekStart = new Date("2026-10-26T00:00:00Z");
    const rows = buildTimesheet(
      source({
        objectives: [{ employeeId: 1, weekStart, objective: 36 }],
        kilometrages: [{ employeeId: 1, weekStart, kilometrage: 120 }],
        frozenWeeks: [{ employeeId: 1, weekStart }],
      }),
    );
    expect(rows[0].weeks[0]).toMatchObject({
      objective: 36,
      kilometrage: 120,
      frozen: true,
    });
    expect(rows[1].weeks[0]).toMatchObject({
      objective: 40,
      kilometrage: 0,
      frozen: false,
    });
  });

  it("builds one column group per week of the period", () => {
    const rows = buildTimesheet(
      source({
        weekStarts: ["2026-10-19", monday],
        entries: [hours(0, 8, 9), { ...hours(-7, 8, 12) }],
      }),
    );
    expect(rows[0].weeks.map(({ total }) => total)).toEqual([4, 1]);
  });
});
