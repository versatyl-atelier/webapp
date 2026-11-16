import { describe, expect, it } from "vitest";

import {
  CABINET_COUNT_READ_LABEL,
  DEFAULT_SUGGESTIONS,
  UNNAMED_CONTACT_LABEL,
} from "@/constants/projects";
import {
  buildSuggestions,
  contactDetails,
  contactHeadline,
  deliveryDate,
  EMPTY_CONTACT,
  isEmptyContact,
  mergeSuggestions,
  nextSortOrder,
  pieceCopyName,
  pieceReadFields,
  piecesByPhase,
  projectColorLabel,
  type PieceRecord,
} from "@/lib/projects";

const piece = (overrides: Partial<PieceRecord>): PieceRecord => ({
  id: 1,
  phaseId: null,
  type: "",
  hasCaisson: true,
  hasFinition: false,
  description: "",
  caissonMaterial: "",
  cladding: [],
  countertop: "",
  drawers: "",
  finish: "",
  cabinetCount: null,
  dropboxLinked: true,
  coverUpdatedAt: null,
  coverX: 50,
  coverY: 50,
  coverZoom: 1,
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

  it("collects every cladding of every piece", () => {
    const suggestions = buildSuggestions(
      [
        piece({ cladding: ["Marbre", "Placage noyer"] }),
        piece({ cladding: ["Marbre"] }),
      ],
      [],
    );
    expect(suggestions.cladding.slice(0, 2)).toEqual([
      "Marbre",
      "Placage noyer",
    ]);
    expect(
      suggestions.cladding.filter((value) => value === "Marbre"),
    ).toHaveLength(1);
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
      pieceReadFields(piece({ countertop: "Quartz blanc", cabinetCount: 0 })),
    ).toEqual([
      { label: "Comptoir", value: "Quartz blanc" },
      { label: CABINET_COUNT_READ_LABEL, value: "0" },
    ]);
  });

  it("joins several claddings and puts them first", () => {
    expect(
      pieceReadFields(
        piece({ cladding: ["Placage noyer", "Laque blanche"], finish: "Mat" }),
      ),
    ).toEqual([
      { label: "Habillage", value: "Placage noyer · Laque blanche" },
      { label: "Finition", value: "Mat" },
    ]);
  });
});

describe("pieceCopyName", () => {
  it("suffixes a name and leaves an empty name empty", () => {
    expect(pieceCopyName("Cuisine")).toBe("Cuisine (copie)");
    expect(pieceCopyName("")).toBe("");
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

describe("projectColorLabel", () => {
  it("names palette colors", () => {
    expect(projectColorLabel("#3B7DD8")).toBe("Bleu");
  });

  it("shows the hex code of custom colors", () => {
    expect(projectColorLabel("#d11595")).toBe("#D11595");
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
