import { describe, expect, it } from "vitest";

import {
  buildAvailabilityWeeks,
  findFirstAvailability,
  loadByDay,
  loadLevel,
  productionDays,
  weekPoints,
  type PlanItem,
  type PlanSettings,
} from "@/lib/lanceurPlan";

const TODAY = "2026-11-02";

const SETTINGS: PlanSettings = {
  capacityRatio: 85000,
  minProdDays: 30,
  maxWeekShare: 10,
  closures: [],
};

function item(overrides: Partial<PlanItem>): PlanItem {
  return {
    id: 1,
    label: "Projet",
    color: null,
    pdmDate: null,
    approvalDate: null,
    deliveryDate: null,
    price: null,
    ...overrides,
  };
}

describe("productionDays and loadByDay", () => {
  it("starts the day after approval and includes delivery", () => {
    const days = productionDays(
      item({ approvalDate: "2026-11-02", deliveryDate: "2026-11-06" }),
      new Set(),
    );
    expect(days).toEqual([
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
    ]);
  });

  it("skips weekends and shop closures", () => {
    const days = productionDays(
      item({ approvalDate: "2026-11-05", deliveryDate: "2026-11-10" }),
      new Set(["2026-11-09"]),
    );
    expect(days).toEqual(["2026-11-06", "2026-11-10"]);
  });

  it("spreads the price evenly over the production days", () => {
    const byDay = loadByDay(
      [
        item({
          approvalDate: "2026-11-02",
          deliveryDate: "2026-11-06",
          price: 4000,
        }),
      ],
      new Set(),
    );
    expect(byDay.get("2026-11-03")).toBe(1000);
    expect(byDay.get("2026-11-02")).toBeUndefined();
  });

  it("converts a week of load to points out of ten", () => {
    const byDay = loadByDay(
      [
        item({
          approvalDate: "2026-10-30",
          deliveryDate: "2026-11-06",
          price: 8500,
        }),
      ],
      new Set(),
    );
    expect(weekPoints(byDay, "2026-11-02", 85000)).toBeCloseTo(1, 5);
  });
});

describe("loadLevel", () => {
  it("classifies rounded weekly points", () => {
    expect(loadLevel(0.2)).toBe("none");
    expect(loadLevel(3.6)).toBe("low");
    expect(loadLevel(6)).toBe("medium");
    expect(loadLevel(9)).toBe("high");
    expect(loadLevel(10)).toBe("full");
    expect(loadLevel(12)).toBe("warning");
    expect(loadLevel(15)).toBe("over");
  });
});

describe("availability", () => {
  it("answers with the whole shop when nothing is planned", () => {
    const weeks = buildAvailabilityWeeks([], SETTINGS, TODAY);
    const result = findFirstAvailability(85000, weeks, SETTINGS);
    expect(result).toEqual({ start: "2026-11-02", end: "2026-12-11" });
  });

  it("does not offer a gap that sits before a wall of overload", () => {
    const wall = item({
      approvalDate: "2026-11-09",
      deliveryDate: "2026-11-13",
      price: 85000 * 2,
    });
    const weeks = buildAvailabilityWeeks([wall], SETTINGS, TODAY);
    expect(weeks[0].free).toBeCloseTo(10, 5);
    expect(weeks[1].free).toBe(0);
    expect(weeks[2].free).toBe(0);
    expect(weeks[3].free).toBeCloseTo(10, 5);
    expect(findFirstAvailability(8500, weeks, SETTINGS)).toMatchObject({
      start: "2026-11-23",
    });
  });

  it("carries overload forward into the next weeks", () => {
    const heavy = item({
      approvalDate: "2026-11-01",
      deliveryDate: "2026-11-06",
      price: 170000,
    });
    const weeks = buildAvailabilityWeeks([heavy], SETTINGS, TODAY);
    expect(weeks[0].free).toBe(0);
    expect(weeks[1].free).toBe(0);
    expect(weeks[2].free).toBeCloseTo(10, 5);
  });

  it("prorates the capacity of a week with a closure", () => {
    const weeks = buildAvailabilityWeeks(
      [],
      { ...SETTINGS, closures: ["2026-11-04"] },
      TODAY,
    );
    expect(weeks[0].capacity).toBe(8);
  });

  it("returns null when the horizon is too short", () => {
    const weeks = buildAvailabilityWeeks([], SETTINGS, TODAY);
    expect(findFirstAvailability(50_000_000, weeks, SETTINGS)).toBeNull();
  });
});
