import { describe, expect, it } from "vitest";

import {
  coverUrl,
  mergePinOrder,
  movePinBefore,
  movePinBy,
  searchProjects,
} from "@/lib/projectHome";

const projects = [
  { name: "Tremblay Sophie" },
  { name: "Gagné Paradis" },
  { name: "Martin Jean-Luc" },
  { name: "Caron Diane" },
];

describe("searchProjects", () => {
  it("returns nothing for an empty query", () => {
    expect(searchProjects(projects, "  ")).toEqual([]);
  });

  it("ignores accents and case", () => {
    expect(searchProjects(projects, "gagne")).toEqual([projects[1]]);
  });

  it("puts names starting with the query first", () => {
    const list = [{ name: "Jean Martin" }, { name: "Martin Jean-Luc" }];
    expect(searchProjects(list, "martin")).toEqual([list[1], list[0]]);
  });

  it("caps the number of results", () => {
    const many = Array.from({ length: 20 }, (_, n) => ({
      name: `Projet ${n}`,
    }));
    expect(searchProjects(many, "projet", 5)).toHaveLength(5);
  });
});

describe("movePinBefore", () => {
  const ids = ["a", "b", "c", "d"];

  it("moves an id before another", () => {
    expect(movePinBefore(ids, "d", "b")).toEqual(["a", "d", "b", "c"]);
  });

  it("moves to the end when there is no target", () => {
    expect(movePinBefore(ids, "a", null)).toEqual(["b", "c", "d", "a"]);
  });

  it("changes nothing for an unknown id or a self drop", () => {
    expect(movePinBefore(ids, "z", "a")).toEqual(ids);
    expect(movePinBefore(ids, "b", "b")).toEqual(ids);
    expect(movePinBefore(ids, "a", "z")).toEqual(ids);
  });
});

describe("movePinBy", () => {
  const ids = ["a", "b", "c"];

  it("shifts by one position", () => {
    expect(movePinBy(ids, "b", 1)).toEqual(["a", "c", "b"]);
    expect(movePinBy(ids, "b", -1)).toEqual(["b", "a", "c"]);
  });

  it("stays put at the edges", () => {
    expect(movePinBy(ids, "a", -1)).toEqual(ids);
    expect(movePinBy(ids, "c", 1)).toEqual(ids);
  });
});

describe("mergePinOrder", () => {
  it("applies the requested order and keeps unlisted pins at the end", () => {
    expect(mergePinOrder(["c", "a"], ["a", "b", "c"])).toEqual(["c", "a", "b"]);
  });

  it("drops unknown and duplicate ids", () => {
    expect(mergePinOrder(["x", "b", "b"], ["a", "b"])).toEqual(["b", "a"]);
  });
});

describe("coverUrl", () => {
  it("versions the url with the encoded file id", () => {
    expect(coverUrl("p1", "id:AB/c")).toBe(
      "/projets/p1/couverture?v=id%3AAB%2Fc",
    );
  });
});
