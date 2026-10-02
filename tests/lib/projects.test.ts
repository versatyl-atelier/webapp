import { describe, expect, it } from "vitest";

import {
  CABINET_COUNT_READ_LABEL,
  CURRENT_COLOR_LABEL,
  PROJECT_COLOR_SWATCHES,
  DEFAULT_SUGGESTIONS,
  PROJECT_STAGES,
  UNNAMED_CONTACT_LABEL,
} from "@/constants/projects";
import { ProjectStage } from "@/generated/prisma/enums";
import {
  activeProjectCount,
  activeProjectsLabel,
  buildSuggestions,
  contactDetails,
  contactHeadline,
  deliveryDate,
  EMPTY_CONTACT,
  isEmptyContact,
  mergeSuggestions,
  nextSortOrder,
  pieceReadFields,
  piecesByPhase,
  projectColorLabel,
  projectColorOptions,
  projectsByStage,
  upcomingDeliveries,
  type DeliveryProject,
  type PieceRecord,
} from "@/lib/projects";

const piece = (overrides: Partial<PieceRecord>): PieceRecord => ({
  id: 1,
  phaseId: null,
  type: "",
  caissonMaterial: "",
  cladding: "",
  doors: "",
  drawers: "",
  hardware: "",
  finish: "",
  cabinetCount: null,
  ...overrides,
});

describe("mergeSuggestions", () => {
  it("puts recent values first, then defaults, without case-insensitive duplicates", () => {
    expect(
      mergeSuggestions(
        ["Noyer", " cuisine ", "", "Noyer"],
        ["Cuisine", "Walk-in"],
      ),
    ).toEqual(["Noyer", "cuisine", "Walk-in"]);
  });
});

describe("buildSuggestions", () => {
  it("falls back to defaults when nothing was saved yet", () => {
    expect(buildSuggestions([], []).type).toEqual(DEFAULT_SUGGESTIONS.type);
  });

  it("uses saved contact companies", () => {
    expect(
      buildSuggestions([], [{ role: "Client", company: "Construction Dubé" }])
        .company,
    ).toEqual(["Construction Dubé"]);
  });
});

describe("contactHeadline / contactDetails", () => {
  it("shows the name and puts the company in the details", () => {
    const contact = {
      ...EMPTY_CONTACT,
      name: "Marc Dubé",
      company: "Construction Dubé",
      phone: "450-555-0198",
    };
    expect(contactHeadline(contact)).toBe("Marc Dubé");
    expect(contactDetails(contact)).toBe("Construction Dubé · 450-555-0198");
  });

  it("falls back to the company, then to a placeholder", () => {
    expect(contactHeadline({ ...EMPTY_CONTACT, company: "Groupe B" })).toBe(
      "Groupe B",
    );
    expect(contactDetails({ ...EMPTY_CONTACT, company: "Groupe B" })).toBe("");
    expect(contactHeadline(EMPTY_CONTACT)).toBe(UNNAMED_CONTACT_LABEL);
  });
});

describe("isEmptyContact", () => {
  it("ignores whitespace-only fields", () => {
    expect(isEmptyContact({ ...EMPTY_CONTACT, name: "  " })).toBe(true);
    expect(isEmptyContact({ ...EMPTY_CONTACT, phone: "1" })).toBe(false);
  });
});

describe("pieceReadFields", () => {
  it("lists only filled fields, including a zero cabinet count", () => {
    expect(
      pieceReadFields(piece({ doors: "Shaker", cabinetCount: 0 })),
    ).toEqual([
      { label: "Portes et façades", value: "Shaker" },
      { label: CABINET_COUNT_READ_LABEL, value: "0" },
    ]);
  });
});

describe("piecesByPhase", () => {
  const pieces = [piece({ id: 1, phaseId: 10 }), piece({ id: 2, phaseId: 20 })];

  it("returns a single flat group when there are no phases", () => {
    expect(piecesByPhase([], pieces)).toEqual([{ phase: null, pieces }]);
  });

  it("groups pieces under their phase, keeping phase order", () => {
    const phases = [
      { id: 20, name: "Phase 2" },
      { id: 10, name: "Phase 1" },
    ];
    expect(piecesByPhase(phases, pieces)).toEqual([
      { phase: phases[0], pieces: [pieces[1]] },
      { phase: phases[1], pieces: [pieces[0]] },
    ]);
  });
});

describe("nextSortOrder", () => {
  it("returns one past the highest sort order", () => {
    expect(nextSortOrder([])).toBe(0);
    expect(nextSortOrder([{ sortOrder: 3 }, { sortOrder: 1 }])).toBe(4);
  });
});

describe("projectColorOptions", () => {
  it("returns the palette alone when the current color is one of its swatches", () => {
    expect(projectColorOptions("#3b7dd8")).toEqual(PROJECT_COLOR_SWATCHES);
  });

  it("keeps a custom color as an extra option", () => {
    expect(projectColorOptions("#d11595").at(-1)).toEqual({
      value: "#d11595",
      label: `${CURRENT_COLOR_LABEL} (#d11595)`,
    });
  });
});

describe("projectColorLabel", () => {
  it("names palette colors", () => {
    expect(projectColorLabel("#3B7DD8")).toBe("Bleu");
  });
});

describe("projectsByStage", () => {
  it("lists every stage in pipeline order, empty ones included", () => {
    const stages = projectsByStage([
      { id: "a", name: "A", stage: ProjectStage.production, color: "#3B7DD8" },
      { id: "b", name: "B", stage: ProjectStage.venteDesign, color: "#3B7DD8" },
      { id: "c", name: "C", stage: ProjectStage.production, color: "#3B7DD8" },
    ]);
    expect(stages.map(({ stage }) => stage)).toEqual(PROJECT_STAGES);
    expect(stages[0].projects.map(({ id }) => id)).toEqual(["b"]);
    expect(
      stages
        .find(({ stage }) => stage === ProjectStage.production)
        ?.projects.map(({ id }) => id),
    ).toEqual(["a", "c"]);
  });
});

describe("activeProjectCount / activeProjectsLabel", () => {
  it("counts every stage except the done one", () => {
    const stages = projectsByStage([
      { id: "a", name: "A", stage: ProjectStage.finition, color: "#3B7DD8" },
      { id: "b", name: "B", stage: ProjectStage.termine, color: "#3B7DD8" },
    ]);
    expect(activeProjectCount(stages)).toBe(1);
  });

  it("pluralizes", () => {
    expect(activeProjectsLabel(1)).toBe("1 projet actif");
    expect(activeProjectsLabel(12)).toBe("12 projets actifs");
  });
});

describe("deliveryDate", () => {
  it("prefers the manual date over the calculated one", () => {
    const manual = new Date("2026-06-01T00:00:00.000Z");
    const calculated = new Date("2026-06-15T00:00:00.000Z");
    expect(
      deliveryDate({
        manualDeliveryDate: manual,
        calculatedDeliveryDate: calculated,
      }),
    ).toBe(manual);
    expect(
      deliveryDate({
        manualDeliveryDate: null,
        calculatedDeliveryDate: calculated,
      }),
    ).toBe(calculated);
  });
});

describe("upcomingDeliveries", () => {
  const project = (
    id: string,
    calculated: string | null,
    manual: string | null = null,
  ): DeliveryProject => ({
    id,
    name: id,
    color: "#3B7DD8",
    calculatedDeliveryDate: calculated ? new Date(calculated) : null,
    manualDeliveryDate: manual ? new Date(manual) : null,
  });

  it("keeps deliveries within the horizon, sorted by date, offset by distance from today", () => {
    expect(
      upcomingDeliveries(
        [
          project("late", "2026-06-23T00:00:00.000Z"),
          project("past", "2026-05-06T00:00:00.000Z"),
          project("none", null),
          project("far", "2026-07-30T00:00:00.000Z"),
          project(
            "soon",
            "2026-07-30T00:00:00.000Z",
            "2026-05-08T00:00:00.000Z",
          ),
          project("today", "2026-05-07T00:00:00.000Z"),
        ],
        "2026-05-07",
        47,
        68,
      ),
    ).toEqual([
      expect.objectContaining({
        id: "today",
        date: "2026-05-07",
        offsetPercent: 0,
      }),
      expect.objectContaining({ id: "soon", date: "2026-05-08" }),
      expect.objectContaining({
        id: "late",
        date: "2026-06-23",
        offsetPercent: 68,
      }),
    ]);
  });
});
