import { describe, it, expect } from "vitest";

import {
  applyPatch,
  formatPrice,
  groupLogEntries,
  formatShortDate,
  isApproved,
  mergeOptionValue,
  phaseLabel,
  sortRows,
  type LanceurRow,
} from "@/lib/lanceur";

const TODAY = "2026-11-04";

function row(overrides: Partial<LanceurRow>): LanceurRow {
  return {
    phaseId: 1,
    projectId: "p1",
    projectName: "Cuisine",
    phaseName: "Phase 1",
    phaseCount: 1,
    priority: 0,
    etape: "",
    isSigned: false,
    approvedOverride: null,
    pdmDate: null,
    approvalDate: null,
    deliveryDate: null,
    price: null,
    installateur: "",
    deliveryComment: "",
    responsibleId: null,
    responsibleName: null,
    responsibleColor: null,
    ...overrides,
  };
}

describe("isApproved", () => {
  it("is false without a date or override", () => {
    expect(
      isApproved({ approvedOverride: null, approvalDate: null }, TODAY),
    ).toBe(false);
  });

  it("is true when the approval date is today or past", () => {
    expect(
      isApproved({ approvedOverride: null, approvalDate: TODAY }, TODAY),
    ).toBe(true);
    expect(
      isApproved({ approvedOverride: null, approvalDate: "2026-10-01" }, TODAY),
    ).toBe(true);
  });

  it("is false when the approval date is in the future", () => {
    expect(
      isApproved({ approvedOverride: null, approvalDate: "2026-11-05" }, TODAY),
    ).toBe(false);
  });

  it("lets a manual override win over the date", () => {
    expect(
      isApproved({ approvedOverride: true, approvalDate: "2026-11-05" }, TODAY),
    ).toBe(true);
    expect(
      isApproved(
        { approvedOverride: false, approvalDate: "2026-10-01" },
        TODAY,
      ),
    ).toBe(false);
  });
});

describe("formatting", () => {
  it("shows a dash for missing values", () => {
    expect(formatShortDate(null)).toBe("—");
    expect(formatPrice(null)).toBe("—");
  });

  it("formats a short date", () => {
    expect(formatShortDate("2026-11-04")).toContain("4");
  });

  it("labels a single-phase project by its name only", () => {
    expect(phaseLabel(row({}))).toBe("Cuisine");
  });

  it("labels each phase of a multi-phase project", () => {
    expect(phaseLabel(row({ phaseCount: 2, phaseName: "Phase 2" }))).toBe(
      "Cuisine · Phase 2",
    );
  });
});

describe("sortRows", () => {
  it("sorts by priority then label", () => {
    const sorted = sortRows([
      row({ phaseId: 1, projectName: "B", priority: 2 }),
      row({ phaseId: 2, projectName: "C", priority: 1 }),
      row({ phaseId: 3, projectName: "A", priority: 1 }),
    ]);
    expect(sorted.map((r) => r.phaseId)).toEqual([3, 2, 1]);
  });
});

describe("mergeOptionValue", () => {
  it("keeps a current value that was removed from the list", () => {
    expect(mergeOptionValue(["a"], "z")).toEqual(["z", "a"]);
    expect(mergeOptionValue(["a"], "a")).toEqual(["a"]);
    expect(mergeOptionValue(["a"], "")).toEqual(["a"]);
  });
});

describe("applyPatch", () => {
  const employees = [{ id: 7, name: "Luc", color: "#112233" }];

  it("resets the manual approval when the approval date changes", () => {
    const next = applyPatch(
      row({ approvedOverride: true }),
      { approvalDate: "2026-12-01" },
      employees,
    );
    expect(next.approvalDate).toBe("2026-12-01");
    expect(next.approvedOverride).toBeNull();
  });

  it("keeps an explicit approval sent with the date", () => {
    const next = applyPatch(
      row({}),
      { approvalDate: "2026-12-01", approvedOverride: true },
      employees,
    );
    expect(next.approvedOverride).toBe(true);
  });

  it("resolves the responsible employee", () => {
    const next = applyPatch(row({}), { responsibleId: 7 }, employees);
    expect(next.responsibleName).toBe("Luc");
    expect(next.responsibleColor).toBe("#112233");
    const cleared = applyPatch(next, { responsibleId: null }, employees);
    expect(cleared.responsibleName).toBeNull();
  });

  it("leaves untouched fields alone", () => {
    const original = row({ etape: "a" });
    expect(applyPatch(original, { isSigned: true }, employees).etape).toBe("a");
  });
});

describe("groupLogEntries", () => {
  it("groups consecutive entries saved together by the same user", () => {
    const groups = groupLogEntries([
      {
        id: 3,
        field: "price",
        oldValue: "1",
        newValue: "2",
        createdAt: "t2",
        userName: "Luc",
      },
      {
        id: 2,
        field: "pdmDate",
        oldValue: null,
        newValue: "d",
        createdAt: "t2",
        userName: "Luc",
      },
      {
        id: 1,
        field: "price",
        oldValue: null,
        newValue: "1",
        createdAt: "t1",
        userName: "Luc",
      },
    ]);
    expect(groups.map((group) => group.entries.length)).toEqual([2, 1]);
  });
});
