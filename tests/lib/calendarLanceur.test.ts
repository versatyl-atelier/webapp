import { describe, expect, it } from "vitest";

import {
  CALENDAR_FILTER_KEYS,
  EVENT_CATEGORIES,
  type CalendarFilterKey,
} from "@/constants/calendar";
import {
  isOccurrenceVisible,
  occurrenceColorClass,
  toggleFilter,
} from "@/lib/calendar";
import { lanceurOccurrences } from "@/lib/calendarLanceur";
import { isLightColor } from "@/lib/color";
import type { LanceurRow } from "@/lib/lanceur";

function row(overrides: Partial<LanceurRow>): LanceurRow {
  return {
    phaseId: 1,
    projectId: "p1",
    projectName: "Peter Rose",
    phaseName: "Phase 1",
    phaseCount: 1,
    priority: 1,
    etape: "",
    isSigned: false,
    approvedOverride: null,
    pdmDate: "2026-11-02",
    approvalDate: "2026-11-09",
    deliveryDate: "2026-12-01",
    price: null,
    installateur: "",
    deliveryComment: "",
    responsibleId: 7,
    responsibleName: "Sophie",
    responsibleColor: "#51e898",
    ...overrides,
  };
}

describe("lanceurOccurrences", () => {
  it("builds one occurrence per date kind inside the range", () => {
    const occurrences = lanceurOccurrences(
      [row({})],
      "2026-11-01",
      "2026-11-30",
    );
    expect(occurrences.map((o) => [o.date, o.filterKey])).toEqual([
      ["2026-11-02", "lanceur:pdm"],
      ["2026-11-09", "lanceur:approval"],
    ]);
  });

  it("tags the title and uses the responsible color", () => {
    const [first] = lanceurOccurrences([row({})], "2026-11-02", "2026-11-02");
    expect(first).toMatchObject({
      category: "lanceur",
      title: "Peter Rose · PDM",
      subcategory: "(lanceur de dates)",
      color: "#51e898",
    });
  });

  it("skips missing dates and falls back to a neutral color", () => {
    const occurrences = lanceurOccurrences(
      [row({ pdmDate: null, approvalDate: null, responsibleColor: null })],
      "2026-11-01",
      "2026-12-31",
    );
    expect(occurrences).toHaveLength(1);
    expect(occurrences[0].filterKey).toBe("lanceur:delivery");
    expect(occurrences[0].color).toBe("#71717a");
  });

  it("names the phase only for multi-phase projects", () => {
    const [first] = lanceurOccurrences(
      [row({ phaseCount: 2, phaseName: "Phase 2" })],
      "2026-11-02",
      "2026-11-02",
    );
    expect(first.title).toBe("Peter Rose · Phase 2 · PDM");
  });
});

describe("isOccurrenceVisible", () => {
  const event = { filterKey: "livraison" as const };
  const pdm = { filterKey: "lanceur:pdm" as const };
  const delivery = { filterKey: "lanceur:delivery" as const };
  const none = new Set<never>();

  it("shows everything when no filter is active", () => {
    expect(isOccurrenceVisible(event, none)).toBe(true);
    expect(isOccurrenceVisible(pdm, none)).toBe(true);
  });

  it("shows only the selected filters", () => {
    const active = new Set(["livraison" as const, "lanceur:pdm" as const]);
    expect(isOccurrenceVisible(event, active)).toBe(true);
    expect(isOccurrenceVisible(pdm, active)).toBe(true);
    expect(isOccurrenceVisible(delivery, active)).toBe(false);
  });

  it("hides lanceur dates when only the regular categories are selected", () => {
    const active = new Set(
      EVENT_CATEGORIES.filter((category) => category !== "lanceur"),
    );
    expect(isOccurrenceVisible(event, active)).toBe(true);
    expect(isOccurrenceVisible(pdm, active)).toBe(false);
    expect(isOccurrenceVisible(delivery, active)).toBe(false);
  });
});

describe("filter reset", () => {
  it("keeps the lanceur out when the six categories are selected", () => {
    let active = new Set<CalendarFilterKey>();
    for (const category of EVENT_CATEGORIES) {
      active = toggleFilter(active, category, CALENDAR_FILTER_KEYS);
    }
    expect(active.size).toBe(EVENT_CATEGORIES.length);
  });

  it("clears the filters once all nine are selected", () => {
    let active = new Set<CalendarFilterKey>();
    for (const key of CALENDAR_FILTER_KEYS) {
      active = toggleFilter(active, key, CALENDAR_FILTER_KEYS);
    }
    expect(active.size).toBe(0);
  });
});

describe("occurrence colors", () => {
  it("tells light colors from dark ones", () => {
    expect(isLightColor("#f2d600")).toBe(true);
    expect(isLightColor("#51e898")).toBe(true);
    expect(isLightColor("#0079bf")).toBe(false);
    expect(isLightColor("#4d4d4d")).toBe(false);
  });

  it("uses a readable text color on custom colors", () => {
    expect(occurrenceColorClass({ color: "#f2d600" })).toContain(
      "text-neutral-950",
    );
    expect(occurrenceColorClass({ color: "#0079bf" })).toContain("text-white");
  });
});
