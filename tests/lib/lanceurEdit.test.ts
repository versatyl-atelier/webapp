import { describe, expect, it } from "vitest";

import {
  buildChangeReport,
  changedDates,
  computeEditChanges,
  snapshotRows,
  type PlanDates,
} from "@/lib/lanceurEdit";
import type { LanceurRow } from "@/lib/lanceur";

const ORIGIN: PlanDates = {
  pdmDate: "2026-11-02",
  approvalDate: "2026-11-09",
  deliveryDate: "2026-11-27",
};

function row(overrides: Partial<LanceurRow>): LanceurRow {
  return {
    phaseId: 1,
    projectId: "p1",
    projectName: "Cuisine <A>",
    phaseName: "Phase 1",
    phaseCount: 1,
    priority: 1,
    etape: "",
    isSigned: false,
    approvedOverride: null,
    pdmDate: ORIGIN.pdmDate,
    approvalDate: ORIGIN.approvalDate,
    deliveryDate: ORIGIN.deliveryDate,
    price: 10000,
    installateur: "",
    deliveryComment: "",
    responsibleId: null,
    responsibleName: null,
    responsibleColor: null,
    ...overrides,
  };
}

describe("changedDates", () => {
  it("lists only the dates that moved", () => {
    expect(
      changedDates(ORIGIN, { ...ORIGIN, deliveryDate: "2026-12-04" }),
    ).toEqual({ deliveryDate: "2026-12-04" });
    expect(changedDates(ORIGIN, ORIGIN)).toEqual({});
  });
});

describe("edit session changes", () => {
  it("detects changed dates and price against the snapshot", () => {
    const snapshot = snapshotRows([row({})]);
    const changes = computeEditChanges(snapshot, [
      row({ deliveryDate: "2026-12-04", price: 12000 }),
    ]);
    expect(changes.map((change) => change.field)).toEqual([
      "price",
      "deliveryDate",
    ]);
    expect(changes[0]).toMatchObject({ oldValue: "10000", newValue: "12000" });
  });

  it("ignores phases added after the snapshot", () => {
    expect(computeEditChanges([], [row({})])).toEqual([]);
  });

  it("builds an escaped report grouped by project", () => {
    const snapshot = snapshotRows([row({})]);
    const changes = computeEditChanges(snapshot, [
      row({ deliveryDate: "2026-12-04" }),
    ]);
    const html = buildChangeReport(changes, "4 novembre 2026");
    expect(html).toContain("Cuisine &lt;A&gt;");
    expect(html).toContain("2026-12-04");
    expect(html).toContain("1 modification, 1 projet");
  });
});
