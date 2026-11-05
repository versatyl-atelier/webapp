import { describe, expect, it } from "vitest";

import {
  EMPTY_SLOT_FORM,
  buildIntakeEntries,
  buildRowPatch,
  intakeSlots,
  rowToSlotForm,
  slotKey,
} from "@/lib/lanceurIntake";
import type { LanceurRow } from "@/lib/lanceur";

describe("intakeSlots", () => {
  it("offers an implicit first phase for a project without phases", () => {
    expect(intakeSlots("p1", [])).toEqual([
      { key: "p1:new", phaseId: null, name: "Phase 1" },
    ]);
  });

  it("lists only the phases that are not already in the lanceur", () => {
    const slots = intakeSlots("p1", [
      { id: 4, name: "Phase 1", isInLanceur: true },
      { id: 5, name: "Phase 2", isInLanceur: false },
    ]);
    expect(slots).toEqual([{ key: "p1:5", phaseId: 5, name: "Phase 2" }]);
  });

  it("offers nothing when every phase is already in the lanceur", () => {
    expect(
      intakeSlots("p1", [{ id: 4, name: "Phase 1", isInLanceur: true }]),
    ).toEqual([]);
  });
});

describe("buildIntakeEntries", () => {
  const slots = [
    { key: slotKey("p1", 5), phaseId: 5, name: "Phase 1" },
    { key: slotKey("p1", 6), phaseId: 6, name: "Phase 2" },
  ];

  it("requires a positive value for each selected phase", () => {
    const { entries, errors } = buildIntakeEntries("p1", slots, {
      "p1:5": { ...EMPTY_SLOT_FORM, price: "" },
      "p1:6": { ...EMPTY_SLOT_FORM, price: "-5" },
    });
    expect(entries).toEqual([]);
    expect(Object.keys(errors)).toEqual(["p1:5", "p1:6"]);
  });

  it("turns empty optional fields into nulls and parses numbers", () => {
    const { entries, errors } = buildIntakeEntries("p1", slots, {
      "p1:6": {
        ...EMPTY_SLOT_FORM,
        price: "48000",
        pdmDate: "2026-11-02",
        etape: "PLANIF",
        responsibleId: "7",
      },
    });
    expect(errors).toEqual({});
    expect(entries).toEqual([
      {
        projectId: "p1",
        phaseId: 6,
        price: 48000,
        pdmDate: "2026-11-02",
        approvalDate: null,
        deliveryDate: null,
        etape: "PLANIF",
        installateur: "",
        responsibleId: 7,
      },
    ]);
  });

  it("ignores phases that were not selected", () => {
    const { entries } = buildIntakeEntries("p1", slots, {});
    expect(entries).toEqual([]);
  });
});

describe("buildRowPatch", () => {
  const row: LanceurRow = {
    phaseId: 1,
    projectId: "p1",
    projectName: "Cuisine",
    phaseName: "Phase 1",
    phaseCount: 1,
    priority: 1,
    etape: "PLANIF",
    isSigned: false,
    approvedOverride: null,
    pdmDate: "2026-11-02",
    approvalDate: null,
    deliveryDate: "2026-12-01",
    price: 10000,
    installateur: "",
    deliveryComment: "",
    responsibleId: 7,
    responsibleName: "Sophie",
    responsibleColor: "#51e898",
  };

  it("returns an empty patch when nothing changed", () => {
    expect(buildRowPatch(row, rowToSlotForm(row))).toEqual({
      patch: {},
      error: null,
    });
  });

  it("includes only the changed fields and clears emptied ones", () => {
    const form = {
      ...rowToSlotForm(row),
      price: "12000",
      deliveryDate: "",
      responsibleId: "",
    };
    expect(buildRowPatch(row, form).patch).toEqual({
      price: 12000,
      deliveryDate: null,
      responsibleId: null,
    });
  });

  it("refuses an empty or non-positive value", () => {
    const form = { ...rowToSlotForm(row), price: "0" };
    expect(buildRowPatch(row, form).error).not.toBeNull();
  });
});
