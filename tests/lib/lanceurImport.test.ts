import { describe, expect, it } from "vitest";

import {
  htmlToText,
  matchEmployee,
  toImportRows,
  type LegacyGroup,
} from "@/lib/lanceurImport";

function group(overrides: Partial<LegacyGroup>): LegacyGroup {
  return {
    id: "grp_1",
    name: " Peter Rose ",
    color: "#0079BF",
    etape: "PLANIF",
    installateur: null,
    sortOrder: 5,
    livraisonComment: null,
    price: 190000,
    signatureDate: "2026-10-29",
    approvalDate: "2026-11-20",
    deliveryDate: "2027-01-18",
    ...overrides,
  };
}

describe("htmlToText", () => {
  it("strips tags and decodes entities", () => {
    expect(htmlToText("<font>a&nbsp;b</font><br>c &amp; d")).toBe("a b\nc & d");
  });

  it("returns an empty string for null or empty html", () => {
    expect(htmlToText(null)).toBe("");
    expect(htmlToText("<br>")).toBe("");
  });
});

describe("toImportRows", () => {
  it("maps the signature date to PDM and flags the project as signed", () => {
    const [row] = toImportRows([group({})]);
    expect(row.pdmDate).toBe("2026-10-29");
    expect(row.isSigned).toBe(true);
    expect(row.projectName).toBe("Peter Rose");
    expect(row.legacyColor).toBe("#0079bf");
  });

  it("leaves a project unsigned without a signature date", () => {
    const [row] = toImportRows([group({ signatureDate: null })]);
    expect(row.isSigned).toBe(false);
    expect(row.pdmDate).toBeNull();
  });

  it("renumbers priorities from 1 by legacy sort order", () => {
    const rows = toImportRows([
      group({ id: "b", sortOrder: 40 }),
      group({ id: "a", sortOrder: 22 }),
    ]);
    expect(rows.map((row) => row.priority)).toEqual([1, 2]);
    expect(rows[0].projectId).toBe("lanceur_a");
  });
});

describe("matchEmployee", () => {
  const employees = [
    { id: 1, name: "Sophie Tremblay" },
    { id: 2, name: "Catherine Roy" },
    { id: 3, name: "Robert Houle" },
  ];

  it("matches a label that prefixes a first name", () => {
    expect(matchEmployee("So", employees)?.id).toBe(1);
    expect(matchEmployee("Cath", employees)?.id).toBe(2);
    expect(matchEmployee("Robert", employees)?.id).toBe(3);
  });

  it("ignores unassigned labels and unknown names", () => {
    expect(matchEmployee("NO NAME", employees)).toBeNull();
    expect(matchEmployee("Rose", employees)).toBeNull();
  });

  it("refuses ambiguous matches", () => {
    expect(
      matchEmployee("Jo", [
        { id: 1, name: "Joan A" },
        { id: 2, name: "Joe B" },
      ]),
    ).toBeNull();
  });
});
