import { describe, expect, it } from "vitest";

import { LANCEUR_FALLBACK_COLOR } from "@/constants/lanceur";
import { buildDayIndex, workingDays } from "@/lib/lanceurGantt";
import type { PlanItem, PlanSettings } from "@/lib/lanceurPlan";
import {
  buildLanceurPreview,
  formatPreviewPoints,
  previewRowDescription,
  previewSpan,
} from "@/lib/lanceurPreview";

const TODAY = "2026-11-18";

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

describe("buildLanceurPreview", () => {
  it("covers thirteen weeks of working days from this week's monday", () => {
    const preview = buildLanceurPreview([], SETTINGS, TODAY);
    expect(preview.dayCount).toBe(65);
    expect(preview.todayIndex).toBe(2);
    expect(preview.weeks).toHaveLength(13);
    expect(preview.weeks[0]).toMatchObject({
      weekStart: "2026-11-16",
      start: 0,
      count: 5,
    });
    expect(
      preview.months.map(({ key, start, count }) => [key, start, count]),
    ).toEqual([
      ["2026-11", 0, 11],
      ["2026-12", 11, 23],
      ["2027-01", 34, 21],
      ["2027-02", 55, 10],
    ]);
    expect(preview.rows).toEqual([]);
  });

  it("clips planning and production to the window", () => {
    const [row] = buildLanceurPreview(
      [
        item({
          pdmDate: "2026-10-01",
          approvalDate: "2026-11-20",
          deliveryDate: "2027-03-30",
        }),
      ],
      SETTINGS,
      TODAY,
    ).rows;
    expect(row.planningSpan).toEqual({ start: 0, count: 5 });
    expect(row.productionSpan).toEqual({ start: 5, count: 60 });
    expect(row.production).toEqual({
      from: "2026-11-21",
      to: "2027-03-30",
    });
    expect(row.color).toBe(LANCEUR_FALLBACK_COLOR);
  });

  it("drops items outside the window or without dates, sorts by start", () => {
    const rows = buildLanceurPreview(
      [
        item({
          id: 1,
          label: "Tard",
          approvalDate: "2027-01-04",
          deliveryDate: "2027-01-29",
        }),
        item({
          id: 2,
          label: "Passé",
          approvalDate: "2026-09-01",
          deliveryDate: "2026-10-30",
        }),
        item({ id: 3, label: "Sans dates" }),
        item({
          id: 4,
          label: "Tôt",
          pdmDate: "2026-11-17",
          approvalDate: "2026-11-24",
        }),
        item({
          id: 5,
          label: "Loin",
          approvalDate: "2027-05-03",
          deliveryDate: "2027-06-01",
        }),
      ],
      SETTINGS,
      TODAY,
    ).rows;
    expect(rows.map(({ id }) => id)).toEqual([4, 1]);
    expect(rows[0].productionSpan).toBeNull();
  });

  it("rates the weekly load in points out of ten", () => {
    const preview = buildLanceurPreview(
      [
        item({
          approvalDate: "2026-11-13",
          deliveryDate: "2026-11-20",
          price: 85000,
        }),
      ],
      SETTINGS,
      TODAY,
    );
    expect(preview.weeks[0].points).toBeCloseTo(10);
    expect(preview.weeks[0].level).toBe("full");
    expect(preview.weeks[1].level).toBe("none");
  });
});

describe("previewSpan", () => {
  const days = workingDays("2026-11-16", 14);
  const index = buildDayIndex(days);

  it("rejects missing, reversed and outside ranges", () => {
    expect(previewSpan(days, index, null)).toBeNull();
    expect(
      previewSpan(days, index, { from: "2026-11-20", to: "2026-11-18" }),
    ).toBeNull();
    expect(
      previewSpan(days, index, { from: "2026-12-01", to: "2026-12-05" }),
    ).toBeNull();
  });

  it("moves weekend dates to the next working day", () => {
    expect(
      previewSpan(days, index, { from: "2026-11-21", to: "2026-11-24" }),
    ).toEqual({ start: 5, count: 2 });
  });
});

describe("previewRowDescription", () => {
  it("lists the planning and production ranges", () => {
    const [row] = buildLanceurPreview(
      [
        item({
          label: "Cuisine Roy",
          pdmDate: "2026-11-16",
          approvalDate: "2026-11-27",
          deliveryDate: "2026-12-18",
        }),
      ],
      SETTINGS,
      TODAY,
    ).rows;
    expect(previewRowDescription(row)).toMatch(
      /^Cuisine Roy : planification .+ au .+, production .+ au .+$/,
    );
  });
});

describe("formatPreviewPoints", () => {
  it("keeps one decimal", () => {
    expect(formatPreviewPoints(7.26)).toBe("7.3 pts /10");
  });
});
