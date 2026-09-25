import { describe, it, expect } from "vitest";

import {
  matchCrumbRoutes,
  resolveCrumbs,
  type CrumbRoutes,
} from "@/lib/breadcrumbs";

const routes: CrumbRoutes = {
  "/punch": "Punch",
  "/punch/reports": "Rapports",
  "/punch/employe/[id]": async ({ id }) => `Employé ${id}`,
};

describe("matchCrumbRoutes", () => {
  it("matches nothing for the root", () => {
    expect(matchCrumbRoutes(routes, [])).toEqual([]);
  });

  it("matches every known prefix", () => {
    expect(
      matchCrumbRoutes(routes, ["punch", "reports"]).map(({ href }) => href),
    ).toEqual(["/punch", "/punch/reports"]);
  });

  it("skips prefixes that are not routes", () => {
    expect(
      matchCrumbRoutes(routes, ["punch", "employe", "7"]).map(
        ({ href }) => href,
      ),
    ).toEqual(["/punch", "/punch/employe/7"]);
  });

  it("captures dynamic params", () => {
    const [, employee] = matchCrumbRoutes(routes, ["punch", "employe", "7"]);
    expect(employee.params).toEqual({ id: "7" });
  });

  it("matches nothing for unknown paths", () => {
    expect(matchCrumbRoutes(routes, ["nope", "punch"])).toEqual([]);
  });
});

describe("resolveCrumbs", () => {
  it("resolves static and dynamic labels in order", async () => {
    expect(await resolveCrumbs(routes, ["punch", "employe", "7"])).toEqual([
      { href: "/punch", label: "Punch" },
      { href: "/punch/employe/7", label: "Employé 7" },
    ]);
  });
});
