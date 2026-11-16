import { describe, expect, it } from "vitest";

import { filterJobines } from "@/lib/jobines";

const jobine = (name: string, description = "", isDeleted = false) => ({
  name,
  description,
  isDeleted,
});

describe("filterJobines", () => {
  const jobines = [
    jobine("Réparation tiroir", "Chez Mme Côté"),
    jobine("Étagère garage"),
    jobine("Vieille retouche", "", true),
  ];

  it("splits active and archived jobines", () => {
    const { active, archived } = filterJobines(jobines, "");
    expect(active.map(({ name }) => name)).toEqual([
      "Réparation tiroir",
      "Étagère garage",
    ]);
    expect(archived.map(({ name }) => name)).toEqual(["Vieille retouche"]);
  });

  it("searches the title and description ignoring accents and case", () => {
    expect(filterJobines(jobines, " ETAGERE ").active).toHaveLength(1);
    expect(filterJobines(jobines, "cote").active[0].name).toBe(
      "Réparation tiroir",
    );
    expect(filterJobines(jobines, "retouche")).toEqual({
      active: [],
      archived: [jobines[2]],
    });
  });
});
