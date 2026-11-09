import { describe, expect, it } from "vitest";

import {
  buildDayIndex,
  computeGanttPreview,
  extendRange,
  initialRange,
  dayIndexOf,
  ganttIndexes,
  indexesToDates,
  rangeDays,
  rangeEnd,
  rangeIncluding,
  monthSpans,
  shiftViewStart,
  weekSpans,
  workingDays,
} from "@/lib/lanceurGantt";

describe("range", () => {
  it("starts twelve months before today and covers three years", () => {
    const range = initialRange("2026-11-05");
    expect(range).toEqual({ start: "2025-11-01", months: 36 });
    expect(rangeEnd(range)).toBe("2028-11-01");
  });

  it("shifts by whole months across year boundaries", () => {
    expect(shiftViewStart("2026-11-01", 2)).toBe("2027-01-01");
    expect(shiftViewStart("2026-01-15", -1)).toBe("2025-12-01");
  });

  it("lists only working days of the range", () => {
    const days = rangeDays({ start: "2026-11-01", months: 1 });
    expect(days[0]).toBe("2026-11-02");
    expect(days[days.length - 1]).toBe("2026-11-30");
    expect(days.length).toBe(21);
  });

  it("extends the past by six months without moving the end", () => {
    const range = { start: "2026-01-01", months: 12 };
    const past = extendRange(range, "past");
    expect(past).toEqual({ start: "2025-07-01", months: 18 });
    expect(rangeEnd(past)).toBe(rangeEnd(range));
  });

  it("extends the future by six months without moving the start", () => {
    const range = { start: "2026-01-01", months: 12 };
    expect(extendRange(range, "future")).toEqual({
      start: "2026-01-01",
      months: 18,
    });
  });

  it("grows until a target is inside with a margin", () => {
    const range = { start: "2026-01-01", months: 12 };
    expect(rangeIncluding(range, "2026-06-15")).toEqual(range);
    const far = rangeIncluding(range, "2030-03-10");
    expect(far.start).toBe("2026-01-01");
    expect(rangeEnd(far) >= "2030-06-01").toBe(true);
    const early = rangeIncluding(range, "2024-02-10");
    expect(early.start <= "2023-11-01").toBe(true);
  });
});

describe("workingDays and spans", () => {
  const days = workingDays("2026-10-29", 10);

  it("skips weekends", () => {
    expect(days).toEqual([
      "2026-10-29",
      "2026-10-30",
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
    ]);
  });

  it("groups days by month", () => {
    expect(monthSpans(days).map(({ key, count }) => [key, count])).toEqual([
      ["2026-10", 2],
      ["2026-11", 5],
    ]);
  });

  it("groups days by week with their start index", () => {
    expect(weekSpans(days)).toEqual([
      { weekStart: "2026-10-26", start: 0, count: 2 },
      { weekStart: "2026-11-02", start: 2, count: 5 },
    ]);
  });
});

describe("dayIndexOf", () => {
  const days = workingDays("2026-11-02", 14);
  const index = buildDayIndex(days);

  it("finds working days and moves weekends to the next monday", () => {
    expect(dayIndexOf(index, "2026-11-04")).toBe(2);
    expect(dayIndexOf(index, "2026-11-07")).toBe(5);
  });

  it("returns -1 for missing or out-of-range dates", () => {
    expect(dayIndexOf(index, null)).toBe(-1);
    expect(dayIndexOf(index, "2027-01-01")).toBe(-1);
  });
});

describe("computeGanttPreview", () => {
  const origin = { pdm: 2, approval: 6, delivery: 12 };

  it("moves all three dates together", () => {
    expect(computeGanttPreview(origin, "planif", "move", 3, 30)).toEqual({
      pdm: 5,
      approval: 9,
      delivery: 15,
    });
  });

  it("refuses a move that leaves the range", () => {
    expect(computeGanttPreview(origin, "prod", "move", 20, 30)).toBeNull();
    expect(computeGanttPreview(origin, "prod", "move", -3, 30)).toBeNull();
  });

  it("keeps missing dates missing when moving", () => {
    expect(
      computeGanttPreview(
        { pdm: -1, approval: 6, delivery: 12 },
        "prod",
        "move",
        2,
        30,
      ),
    ).toEqual({ pdm: -1, approval: 8, delivery: 14 });
  });

  it("resizes the planning start up to the approval", () => {
    expect(computeGanttPreview(origin, "planif", "left", -1, 30)?.pdm).toBe(1);
    expect(computeGanttPreview(origin, "planif", "left", 4, 30)).toBeNull();
  });

  it("resizes the planning end between pdm and delivery", () => {
    expect(
      computeGanttPreview(origin, "planif", "right", 2, 30)?.approval,
    ).toBe(8);
    expect(computeGanttPreview(origin, "planif", "right", -4, 30)).toBeNull();
    expect(computeGanttPreview(origin, "planif", "right", 6, 30)).toBeNull();
  });

  it("resizes production edges", () => {
    expect(computeGanttPreview(origin, "prod", "left", 1, 30)?.approval).toBe(
      7,
    );
    expect(computeGanttPreview(origin, "prod", "right", 3, 30)?.delivery).toBe(
      15,
    );
    expect(computeGanttPreview(origin, "prod", "right", -7, 30)).toBeNull();
  });
});

describe("indexes and dates", () => {
  const days = workingDays("2026-11-02", 14);
  const index = buildDayIndex(days);
  const dates = {
    pdmDate: "2026-11-02",
    approvalDate: "2026-11-06",
    deliveryDate: "2026-11-13",
  };

  it("round-trips dates through indexes", () => {
    const indexes = ganttIndexes(dates, index);
    expect(indexes).toEqual({ pdm: 0, approval: 4, delivery: 9 });
    expect(indexesToDates(days, indexes, dates)).toEqual(dates);
  });

  it("falls back to the original date when an index is missing", () => {
    expect(
      indexesToDates(
        days,
        { pdm: -1, approval: 4, delivery: 9 },
        {
          ...dates,
          pdmDate: "2020-01-01",
        },
      ).pdmDate,
    ).toBe("2020-01-01");
  });
});
