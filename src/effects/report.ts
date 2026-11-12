import { Effect } from "effect";

import type { PrismaService } from "@/generated/effect-prisma";
import type {
  TimeEntryFindManyArgs,
  TimeEntryProjectFindManyArgs,
} from "@/generated/prisma/models";
import { parseItemKey } from "@/lib/itemKey";
import { projectLinkIds } from "@/lib/projectLinks";
import { buildReport, usedProjects, type ReportRequest } from "@/lib/report";
import { localDateFromKey } from "@/lib/time";

export const getReportProjectsEffect = Effect.fn("getReportProjects")(
  function* (prisma: PrismaService) {
    const args = {
      where: { timeEntry: { isDeleted: false, end: { not: null } } },
      select: {
        projectType: true,
        projectId: true,
        taskId: true,
        jobineId: true,
        project: { select: { name: true, isDeleted: true } },
        task: { select: { name: true, isDeleted: true } },
        jobine: { select: { name: true, isDeleted: true } },
        timeEntry: { select: { start: true, end: true } },
      },
    } satisfies TimeEntryProjectFindManyArgs;
    return usedProjects(yield* prisma.timeEntryProject.findMany(args));
  },
);

function presentIds<T extends string | number>(ids: readonly (T | null)[]) {
  return ids.filter(
    (id): id is T =>
      id !== null && !(typeof id === "number" && Number.isNaN(id)),
  );
}

function endOfDay(day: string): Date {
  const date = localDateFromKey(day);
  date.setHours(23, 59, 59, 999);
  return date;
}

export const getReportEffect = Effect.fn("getReport")(function* (
  prisma: PrismaService,
  { projects, groupings, start, end }: ReportRequest,
) {
  yield* Effect.annotateLogsScoped({
    projectCount: projects.length,
    groupings: groupings.join(","),
  });

  const links = projects.map((key) => projectLinkIds(parseItemKey(key)));

  const args = {
    where: {
      isDeleted: false,
      end: { not: null },
      ...(start || end
        ? {
            start: {
              ...(start ? { gte: localDateFromKey(start) } : {}),
              ...(end ? { lte: endOfDay(end) } : {}),
            },
          }
        : {}),
      projects: {
        some: {
          OR: [
            { projectId: { in: presentIds(links.map((l) => l.projectId)) } },
            { taskId: { in: presentIds(links.map((l) => l.taskId)) } },
            { jobineId: { in: presentIds(links.map((l) => l.jobineId)) } },
          ],
        },
      },
    },
    select: {
      start: true,
      end: true,
      employee: {
        select: {
          id: true,
          name: true,
          statut: { select: { description: true } },
        },
      },
      subtask: { select: { id: true, name: true } },
      projects: {
        select: {
          projectType: true,
          projectId: true,
          taskId: true,
          jobineId: true,
          project: { select: { name: true } },
          task: { select: { name: true } },
          jobine: { select: { name: true } },
        },
      },
    },
  } satisfies TimeEntryFindManyArgs;
  const entries = yield* prisma.timeEntry.findMany(args);

  return buildReport({
    entries,
    selectedKeys: new Set(projects),
    groupings,
    start,
    end,
  });
});
