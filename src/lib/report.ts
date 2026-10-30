import {
  GROUPING_REQUIRED_MESSAGE,
  NO_STATUT_LABEL,
  PERIOD_ALL_LABEL,
  PERIOD_FROM_LABEL,
  PERIOD_RANGE_END_LABEL,
  PERIOD_RANGE_LABEL,
  PERIOD_UNTIL_LABEL,
  PROJECT_REQUIRED_REPORT_MESSAGE,
  REPORT_END_PARAM,
  REPORT_GROUPING_PARAM,
  REPORT_GROUPINGS,
  REPORT_PROJECT_PARAM,
  REPORT_START_PARAM,
  NO_SUBTASK_LABEL,
  UNKNOWN_EMPLOYEE_LABEL,
  type ProjectTypeFilter,
  type ReportGrouping,
} from "@/constants/report";
import {
  END_DATE_BEFORE_START_MESSAGE,
  INVALID_DATE_MESSAGE,
} from "@/constants/calendar";
import { DEFAULT_SUBTASK_ID } from "@/constants/tasks";
import { ProjectType } from "@/generated/prisma/enums";
import { isDateKey, type DateKey } from "@/lib/calendar";
import { stringifyItemKey } from "@/lib/itemKey";
import { normalize } from "@/lib/text";
import { localDateKeyOf } from "@/lib/timesheet";

const MS_PER_HOUR = 60 * 60 * 1000;

type ProjectLink = {
  projectType: ProjectType;
  projectId: string | null;
  taskId: number | null;
  project: { name: string; isDeleted?: boolean } | null;
  task: { name: string; isDeleted?: boolean } | null;
};

export type UsedProjectSource = ProjectLink & {
  timeEntry: { start: Date; end: Date | null };
};

export type UsedProject = {
  key: string;
  type: ProjectType;
  name: string;
  archived: boolean;
  hours: number;
  entries: number;
  lastDate: DateKey | null;
};

export type ReportEntry = {
  start: Date;
  end: Date | null;
  employee: {
    id: number;
    name: string;
    statut: { description: string } | null;
  } | null;
  subtask: { id: string; name: string };
  projects: ProjectLink[];
};

export type ReportRow = {
  key: string;
  label: string;
  hours: number;
  children?: ReportRow[];
};

export type ReportSection = {
  grouping: ReportGrouping;
  rows: ReportRow[];
  total: number;
};

export type Report = {
  start: string | null;
  end: string | null;
  projectNames: string[];
  entryCount: number;
  totalHours: number;
  sections: ReportSection[];
};

type ReportLine = {
  projectKey: string;
  projectName: string;
  employeeKey: string;
  employeeName: string;
  statutName: string;
  subtaskName: string;
  hours: number;
};

function hoursBetween(start: Date, end: Date | null): number {
  return end ? (end.getTime() - start.getTime()) / MS_PER_HOUR : 0;
}

export function projectKeyOf({
  projectType,
  projectId,
  taskId,
}: Pick<ProjectLink, "projectType" | "projectId" | "taskId">): string | null {
  const id = projectType === ProjectType.trello ? projectId : taskId;
  return id === null ? null : stringifyItemKey({ type: projectType, id });
}

function compareByName(a: { name: string }, b: { name: string }): number {
  return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
}

export function usedProjects(
  rows: readonly UsedProjectSource[],
): UsedProject[] {
  const byKey = new Map<string, UsedProject>();

  rows.forEach((row) => {
    const key = projectKeyOf(row);
    const source =
      row.projectType === ProjectType.trello ? row.project : row.task;
    if (key === null || !source || !row.timeEntry.end) return;

    const day = localDateKeyOf(row.timeEntry.start);
    const current = byKey.get(key);
    byKey.set(key, {
      key,
      type: row.projectType,
      name: source.name,
      archived: !!source.isDeleted,
      hours:
        (current?.hours ?? 0) +
        hoursBetween(row.timeEntry.start, row.timeEntry.end),
      entries: (current?.entries ?? 0) + 1,
      lastDate:
        current?.lastDate && current.lastDate > day ? current.lastDate : day,
    });
  });

  return [...byKey.values()].sort(compareByName);
}

export function filterProjects(
  projects: readonly UsedProject[],
  typeFilter: ProjectTypeFilter,
  query: string,
): UsedProject[] {
  const needle = normalize(query);
  return projects.filter(
    ({ type, name }) =>
      (typeFilter === "all" || type === typeFilter) &&
      normalize(name).includes(needle),
  );
}

function reportLines(
  entries: readonly ReportEntry[],
  selectedKeys: ReadonlySet<string>,
): { lines: ReportLine[]; entryCount: number } {
  let entryCount = 0;
  const lines = entries.flatMap((entry) => {
    if (!entry.end) return [];
    const hours = hoursBetween(entry.start, entry.end);
    const matching = entry.projects.flatMap((link) => {
      const projectKey = projectKeyOf(link);
      const source =
        link.projectType === ProjectType.trello ? link.project : link.task;
      return projectKey !== null && selectedKeys.has(projectKey) && source
        ? [{ projectKey, projectName: source.name }]
        : [];
    });
    if (matching.length > 0) entryCount += 1;
    return matching.map(({ projectKey, projectName }) => ({
      projectKey,
      projectName,
      employeeKey: String(entry.employee?.id ?? "unknown"),
      employeeName: entry.employee?.name ?? UNKNOWN_EMPLOYEE_LABEL,
      statutName: entry.employee?.statut?.description ?? NO_STATUT_LABEL,
      subtaskName:
        entry.subtask.id === DEFAULT_SUBTASK_ID
          ? NO_SUBTASK_LABEL
          : entry.subtask.name,
      hours,
    }));
  });
  return { lines, entryCount };
}

function sortRows(rows: ReportRow[]): ReportRow[] {
  return rows.sort(
    (a, b) =>
      b.hours - a.hours ||
      a.label.localeCompare(b.label, "fr", { sensitivity: "base" }),
  );
}

function groupLines(
  lines: readonly ReportLine[],
  keyOf: (line: ReportLine) => { key: string; label: string },
  childrenOf?: (lines: ReportLine[]) => ReportRow[],
): ReportRow[] {
  const groups = new Map<string, { label: string; lines: ReportLine[] }>();
  lines.forEach((line) => {
    const { key, label } = keyOf(line);
    const group = groups.get(key) ?? { label, lines: [] };
    group.lines.push(line);
    groups.set(key, group);
  });
  return sortRows(
    [...groups.entries()].map(([key, group]) => ({
      key,
      label: group.label,
      hours: group.lines.reduce((sum, line) => sum + line.hours, 0),
      children: childrenOf?.(group.lines),
    })),
  );
}

function sectionRows(
  grouping: ReportGrouping,
  lines: readonly ReportLine[],
): ReportRow[] {
  switch (grouping) {
    case "project":
      return groupLines(lines, (line) => ({
        key: line.projectKey,
        label: line.projectName,
      }));
    case "employee":
      return groupLines(lines, (line) => ({
        key: line.employeeKey,
        label: line.employeeName,
      }));
    case "statut":
      return groupLines(lines, (line) => ({
        key: line.statutName,
        label: line.statutName,
      }));
    case "subtask":
      return groupLines(
        lines,
        (line) => ({ key: line.projectKey, label: line.projectName }),
        (projectLines) =>
          groupLines(
            projectLines,
            (line) => ({ key: line.subtaskName, label: line.subtaskName }),
            (subtaskLines) =>
              groupLines(subtaskLines, (line) => ({
                key: line.statutName,
                label: line.statutName,
              })),
          ),
      );
  }
}

export function buildReport({
  entries,
  selectedKeys,
  groupings,
  start,
  end,
}: {
  entries: readonly ReportEntry[];
  selectedKeys: ReadonlySet<string>;
  groupings: readonly ReportGrouping[];
  start: string | null;
  end: string | null;
}): Report {
  const { lines, entryCount } = reportLines(entries, selectedKeys);
  const totalHours = lines.reduce((sum, line) => sum + line.hours, 0);

  return {
    start,
    end,
    projectNames: [
      ...new Set(lines.map(({ projectName }) => projectName)),
    ].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" })),
    entryCount,
    totalHours,
    sections: groupings.map((grouping) => ({
      grouping,
      rows: sectionRows(grouping, lines),
      total: totalHours,
    })),
  };
}

export type ReportRequest = {
  projects: string[];
  groupings: ReportGrouping[];
  start: DateKey | null;
  end: DateKey | null;
};

export type ReportRequestResult =
  { request: ReportRequest } | { error: string };

type SearchParams = { [key: string]: string | string[] | undefined };

function valuesOf(value: string | string[] | undefined): string[] {
  return (Array.isArray(value) ? value : [value]).filter(
    (item): item is string => !!item,
  );
}

function dateParam(value: string | string[] | undefined) {
  const [first = ""] = valuesOf(value);
  return first.trim();
}

export function parseReportRequest(params: SearchParams): ReportRequestResult {
  const projects = [...new Set(valuesOf(params[REPORT_PROJECT_PARAM]))];
  if (projects.length === 0) return { error: PROJECT_REQUIRED_REPORT_MESSAGE };

  const requested = valuesOf(params[REPORT_GROUPING_PARAM]);
  const groupings = REPORT_GROUPINGS.filter((grouping) =>
    requested.includes(grouping),
  );
  if (groupings.length === 0) return { error: GROUPING_REQUIRED_MESSAGE };

  const start = dateParam(params[REPORT_START_PARAM]);
  const end = dateParam(params[REPORT_END_PARAM]);
  if ((start && !isDateKey(start)) || (end && !isDateKey(end))) {
    return { error: INVALID_DATE_MESSAGE };
  }
  if (start && end && start > end) {
    return { error: END_DATE_BEFORE_START_MESSAGE };
  }

  return {
    request: { projects, groupings, start: start || null, end: end || null },
  };
}

export function formatReportPeriod({
  start,
  end,
}: Pick<Report, "start" | "end">): string {
  if (start && end) {
    return `${PERIOD_RANGE_LABEL} ${start} ${PERIOD_RANGE_END_LABEL} ${end}`;
  }
  if (start) return `${PERIOD_FROM_LABEL} ${start}`;
  if (end) return `${PERIOD_UNTIL_LABEL} ${end}`;
  return PERIOD_ALL_LABEL;
}
