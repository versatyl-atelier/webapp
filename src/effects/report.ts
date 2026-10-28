import { Effect } from "effect";

import type { PrismaService } from "@/generated/effect-prisma";
import { ProjectType } from "@/generated/prisma/enums";
import type {
  TimeEntryFindManyArgs,
  TimeEntryProjectFindManyArgs,
} from "@/generated/prisma/models";
import { parseItemKey } from "@/lib/itemKey";
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
        project: { select: { name: true, isDeleted: true } },
        task: { select: { name: true, isDeleted: true } },
        timeEntry: { select: { start: true, end: true } },
      },
    } satisfies TimeEntryProjectFindManyArgs;
    return usedProjects(yield* prisma.timeEntryProject.findMany(args));
  },
);

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

  const links = projects.map(parseItemKey);
  const projectIds = links
    .filter(({ type }) => type === ProjectType.trello)
    .map(({ id }) => String(id));
  const taskIds = links
    .filter(({ type }) => type === ProjectType.task)
    .map(({ id }) => parseInt(String(id), 10))
    .filter((id) => !Number.isNaN(id));

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
            { projectType: ProjectType.trello, projectId: { in: projectIds } },
            { projectType: ProjectType.task, taskId: { in: taskIds } },
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
          project: { select: { name: true } },
          task: { select: { name: true } },
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
