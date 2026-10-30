import { describe, expect, it } from "vitest";

import {
  NO_STATUT_LABEL,
  NO_SUBTASK_LABEL,
  UNKNOWN_EMPLOYEE_LABEL,
} from "@/constants/report";
import { DEFAULT_SUBTASK_ID } from "@/constants/tasks";
import { ProjectType } from "@/generated/prisma/enums";
import {
  parseReportRequest,
  buildReport,
  filterProjects,
  formatReportPeriod,
  projectKeyOf,
  usedProjects,
  type ReportEntry,
  type UsedProjectSource,
} from "@/lib/report";

const at = (day: number, hour: number) => new Date(2026, 9, day, hour);

const trello = (id: string | null, name: string | null, isDeleted = false) => ({
  projectType: ProjectType.trello,
  projectId: id,
  taskId: null,
  project: name ? { name, isDeleted } : null,
  task: null,
});

const task = (id: number, name: string) => ({
  projectType: ProjectType.task,
  projectId: null,
  taskId: id,
  project: null,
  task: { name },
});

const usage = (
  link: ReturnType<typeof trello> | ReturnType<typeof task>,
  start: Date,
  end: Date | null,
): UsedProjectSource => ({ ...link, timeEntry: { start, end } });

describe("projectKeyOf", () => {
  it("builds the same key as the project selector", () => {
    expect(projectKeyOf(trello("abc", "X"))).toBe("trello:abc");
    expect(projectKeyOf(task(3, "Fabrication"))).toBe("task:3");
  });

  it("has no key when the project was deleted", () => {
    expect(projectKeyOf(trello(null, null))).toBeNull();
  });
});

describe("usedProjects", () => {
  it("lists only what appears in time entries, with hours and last day", () => {
    const projects = usedProjects([
      usage(trello("a", "Gagné"), at(26, 8), at(26, 12)),
      usage(trello("a", "Gagné"), at(28, 8), at(28, 10)),
      usage(task(1, "Fabrication"), at(27, 8), at(27, 9)),
    ]);
    expect(projects).toEqual([
      {
        key: "task:1",
        type: ProjectType.task,
        name: "Fabrication",
        archived: false,
        hours: 1,
        entries: 1,
        lastDate: "2026-10-27",
      },
      {
        key: "trello:a",
        type: ProjectType.trello,
        name: "Gagné",
        archived: false,
        hours: 6,
        entries: 2,
        lastDate: "2026-10-28",
      },
    ]);
  });

  it("flags archived projects but keeps them", () => {
    const [project] = usedProjects([
      usage(trello("a", "Vieux projet", true), at(26, 8), at(26, 9)),
    ]);
    expect(project.archived).toBe(true);
  });

  it("skips running punches and projects that no longer exist", () => {
    expect(
      usedProjects([
        usage(trello("a", "En cours"), at(26, 8), null),
        usage(trello(null, null), at(26, 8), at(26, 9)),
      ]),
    ).toEqual([]);
  });

  it("sorts by name without caring for accents or case", () => {
    const names = usedProjects([
      usage(trello("a", "zèbre"), at(26, 8), at(26, 9)),
      usage(trello("b", "Écurie"), at(26, 8), at(26, 9)),
      usage(trello("c", "arbre"), at(26, 8), at(26, 9)),
    ]).map(({ name }) => name);
    expect(names).toEqual(["arbre", "Écurie", "zèbre"]);
  });
});

describe("filterProjects", () => {
  const projects = usedProjects([
    usage(trello("a", "Gagné Paradis"), at(26, 8), at(26, 9)),
    usage(task(1, "Fabrication"), at(26, 8), at(26, 9)),
  ]);

  it("filters by type", () => {
    expect(
      filterProjects(projects, "task", "").map(({ name }) => name),
    ).toEqual(["Fabrication"]);
    expect(filterProjects(projects, "all", "")).toHaveLength(2);
  });

  it("searches by name ignoring accents and case", () => {
    expect(
      filterProjects(projects, "all", "  gagne ").map(({ name }) => name),
    ).toEqual(["Gagné Paradis"]);
  });
});

describe("buildReport", () => {
  const entry = (
    overrides: Partial<ReportEntry> & Pick<ReportEntry, "projects">,
  ): ReportEntry => ({
    start: at(26, 8),
    end: at(26, 12),
    employee: {
      id: 1,
      name: "Patrice",
      statut: { description: "Bureau" },
    },
    subtask: { id: DEFAULT_SUBTASK_ID, name: "Défaut" },
    ...overrides,
  });

  const entries: ReportEntry[] = [
    entry({ projects: [trello("a", "Gagné")] }),
    entry({
      start: at(27, 8),
      end: at(27, 10),
      employee: { id: 2, name: "Sophie", statut: { description: "Atelier" } },
      subtask: { id: "s1", name: "Armoire" },
      projects: [trello("a", "Gagné")],
    }),
    entry({
      start: at(27, 13),
      end: at(27, 14),
      projects: [task(1, "Fabrication")],
    }),
    entry({ projects: [trello("z", "Autre projet")] }),
  ];

  const report = (groupings: Parameters<typeof buildReport>[0]["groupings"]) =>
    buildReport({
      entries,
      selectedKeys: new Set(["trello:a", "task:1"]),
      groupings,
      start: null,
      end: null,
    });

  it("only counts the selected projects", () => {
    const result = report(["project"]);
    expect(result.totalHours).toBe(7);
    expect(result.entryCount).toBe(3);
    expect(result.projectNames).toEqual(["Fabrication", "Gagné"]);
    expect(
      result.sections[0].rows.map(({ label, hours }) => [label, hours]),
    ).toEqual([
      ["Gagné", 6],
      ["Fabrication", 1],
    ]);
  });

  it("groups by employee and by status with the same total", () => {
    const [byEmployee, byStatut] = report(["employee", "statut"]).sections;
    expect(byEmployee.rows.map(({ label, hours }) => [label, hours])).toEqual([
      ["Patrice", 5],
      ["Sophie", 2],
    ]);
    expect(byStatut.rows.map(({ label, hours }) => [label, hours])).toEqual([
      ["Bureau", 5],
      ["Atelier", 2],
    ]);
    expect(byEmployee.total).toBe(7);
    expect(byStatut.total).toBe(7);
  });

  it("nests project, then subtask, then status", () => {
    const [section] = report(["subtask"]).sections;
    const gagne = section.rows.find(({ label }) => label === "Gagné");
    expect(gagne?.hours).toBe(6);
    expect(gagne?.children?.map(({ label, hours }) => [label, hours])).toEqual([
      [NO_SUBTASK_LABEL, 4],
      ["Armoire", 2],
    ]);
    expect(
      gagne?.children?.[1].children?.map(({ label, hours }) => [label, hours]),
    ).toEqual([["Atelier", 2]]);
  });

  it("falls back to labels when the employee or status is missing", () => {
    const result = buildReport({
      entries: [
        entry({ employee: null, projects: [trello("a", "Gagné")] }),
        entry({
          employee: { id: 3, name: "Luc", statut: null },
          projects: [trello("a", "Gagné")],
        }),
      ],
      selectedKeys: new Set(["trello:a"]),
      groupings: ["employee", "statut"],
      start: null,
      end: null,
    });
    expect(result.sections[0].rows.map(({ label }) => label).sort()).toEqual(
      ["Luc", UNKNOWN_EMPLOYEE_LABEL].sort(),
    );
    expect(result.sections[1].rows.map(({ label }) => label).sort()).toEqual([
      NO_STATUT_LABEL,
    ]);
  });

  it("ignores running punches", () => {
    const result = buildReport({
      entries: [entry({ end: null, projects: [trello("a", "Gagné")] })],
      selectedKeys: new Set(["trello:a"]),
      groupings: ["project"],
      start: null,
      end: null,
    });
    expect(result.totalHours).toBe(0);
    expect(result.entryCount).toBe(0);
  });
});

describe("parseReportRequest", () => {
  it("reads repeated parameters and keeps the groupings in display order", () => {
    const result = parseReportRequest({
      projet: ["trello:a", "task:1", "trello:a"],
      groupement: ["statut", "project"],
      du: "2026-10-01",
      au: "2026-10-31",
    });
    expect(result).toEqual({
      request: {
        projects: ["trello:a", "task:1"],
        groupings: ["project", "statut"],
        start: "2026-10-01",
        end: "2026-10-31",
      },
    });
  });

  it("accepts a single value and an open period", () => {
    expect(
      parseReportRequest({ projet: "task:1", groupement: "employee", du: "" }),
    ).toEqual({
      request: {
        projects: ["task:1"],
        groupings: ["employee"],
        start: null,
        end: null,
      },
    });
  });

  it("refuses a request without projects or without groupings", () => {
    expect(parseReportRequest({ groupement: "project" })).toHaveProperty(
      "error",
    );
    expect(parseReportRequest({ projet: "task:1" })).toHaveProperty("error");
    expect(
      parseReportRequest({ projet: "task:1", groupement: "nope" }),
    ).toHaveProperty("error");
  });

  it("refuses invalid or reversed dates", () => {
    const base = { projet: "task:1", groupement: "project" };
    expect(parseReportRequest({ ...base, du: "2026-13-40" })).toHaveProperty(
      "error",
    );
    expect(
      parseReportRequest({ ...base, du: "2026-10-31", au: "2026-10-01" }),
    ).toHaveProperty("error");
  });
});

describe("formatReportPeriod", () => {
  it("describes closed, open-ended and unbounded periods", () => {
    expect(formatReportPeriod({ start: "2026-10-01", end: "2026-10-31" })).toBe(
      "Du 2026-10-01 au 2026-10-31",
    );
    expect(formatReportPeriod({ start: "2026-10-01", end: null })).toBe(
      "À partir du 2026-10-01",
    );
    expect(formatReportPeriod({ start: null, end: "2026-10-31" })).toBe(
      "Jusqu'au 2026-10-31",
    );
    expect(formatReportPeriod({ start: null, end: null })).toBe(
      "Toutes les dates",
    );
  });
});
