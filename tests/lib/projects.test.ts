import { describe, expect, it } from "vitest";

import {
  CABINET_COUNT_READ_LABEL,
  CURRENT_COLOR_LABEL,
  PROJECT_COLOR_SWATCHES,
  DEFAULT_SUGGESTIONS,
  UNNAMED_CONTACT_LABEL,
} from "@/constants/projects";
import {
  buildSuggestions,
  contactDetails,
  contactHeadline,
  EMPTY_CONTACT,
  isEmptyContact,
  mergeSuggestions,
  nextSortOrder,
  pieceReadFields,
  piecesByPhase,
  projectColorLabel,
  projectColorOptions,
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
