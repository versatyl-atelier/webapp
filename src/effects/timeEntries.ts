import { Effect } from "effect";

import type { PrismaService } from "@/generated/effect-prisma";
import { TimeEntry } from "@/generated/prisma/client";
import { ProjectType } from "@/generated/prisma/enums";
import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import {
  TimeEntryDeleteArgs,
  TimeEntryFindFirstArgs,
  TimeEntryProjectCreateManyArgs,
  TimeEntryProjectDeleteManyArgs,
  TimeEntryUpdateArgs,
  TimeEntryWhereInput,
} from "@/generated/prisma/models";

import { deleteTimeEntry, putTimeEntry } from "@/actions/timeEntries";
import {
  timeEntryInclude,
  DateRange,
  type EditTimeEntryFormState,
} from "@/schemas/timeEntries.schemas";

import { parseItemKey } from "@/lib/itemKey";
import { secondsToHours, parseTimeToSeconds } from "@/lib/time";
import { assertWeekNotFrozen, handleWeekFrozen } from "@/effects/frozenWeeks";
import { ProjectOrTask } from "@/components/ProjectSelect";

export const deleteTimeEntryEffect = Effect.fn("deleteTimeEntry")(function* (
  prisma: PrismaService,
  entryId: number,
) {
  yield* Effect.annotateLogsScoped({ timeEntryId: entryId });
  const args: TimeEntryDeleteArgs = {
    where: {
      id: entryId,
    },
  };
  return yield* prisma.timeEntry.delete(args);
});
export const getTimeEntriesEffect = Effect.fn("getTimeEntries")(function* (
  prisma: PrismaService,
  employeeId: number,
  { startDate, endDate }: DateRange,
) {
  const where: TimeEntryWhereInput = {
    employeeId,
    isDeleted: false,
  };

  if (startDate || endDate) {
    where.start = {};
    if (startDate) {
      where.start.gte = new Date(startDate);
    }
    if (endDate) {
      where.start.lte = new Date(endDate);
    }
  }
  const args = {
    include: timeEntryInclude,
    where,
    orderBy: [{ start: SortOrder.desc }, { id: SortOrder.asc }],
  };
  return yield* prisma.timeEntry.findMany(args);
});
export const editTimeEntryEffect = Effect.fn("editTimeEntry")(
  function* (
    prisma: PrismaService,
    _formState: EditTimeEntryFormState,
    {
      timeEntryId,
      projectId,
      startTime,
      hours,
      command,
    }: Record<string, FormDataEntryValue | null>,
  ) {
    const entryId = parseInt(String(timeEntryId), 10);
    yield* Effect.annotateLogsScoped({ timeEntryId: entryId });

    const findArgs: TimeEntryFindFirstArgs = {
      where: { id: entryId, isDeleted: false },
    };
    const existingEntry = yield* prisma.timeEntry.findFirst(findArgs);

    if (existingEntry?.employeeId) {
      yield* Effect.annotateLogsScoped({
        employeeId: existingEntry.employeeId,
      });
      yield* assertWeekNotFrozen(
        prisma,
        existingEntry.employeeId,
        existingEntry.start,
      );
    }

    switch (command) {
      case "save": {
        const hourValue = secondsToHours(parseTimeToSeconds(String(hours)));
        const start = new Date(String(startTime));
        const end = new Date(start.getTime() + hourValue * 3600000);
        const { id, type } = parseItemKey(String(projectId));
        const strId = id.toString();
        yield* Effect.tryPromise(() =>
          putTimeEntry({
            id: entryId,
            start,
            end,
            projects: [
              {
                id: type === ProjectType.trello ? strId : parseInt(strId, 10),
                type,
              },
            ],
          }),
        );
        return {
          message: "Sauvegardé",
        };
      }
      case "delete":
        yield* Effect.tryPromise(() => deleteTimeEntry(entryId));
        return {
          message: "Supprimé",
        };
      default:
        throw new Error(`Unhandled \`editTimeEntry\` command: ${command}`);
    }
  },
  Effect.catchTag("WeekFrozenError", handleWeekFrozen),
);
export const putTimeEntryEffect = Effect.fn("putTimeEntry")(function* (
  prisma: PrismaService,
  entry: Partial<TimeEntry> & {
    projects: ProjectOrTask[];
  },
) {
  if (!entry.id || !entry.projects) {
    return null; // TODO Fail more informatively?
  }
  const entryId = entry.id;
  yield* Effect.annotateLogsScoped({ timeEntryId: entryId });

  const deleteTimeEntryProjectArgs: TimeEntryProjectDeleteManyArgs = {
    where: {
      timeEntryId: entryId,
    },
  };

  const createManyTimeEntryProjectArgs: TimeEntryProjectCreateManyArgs = {
    data: entry.projects.map(({ id, type }) => {
      const strId = id.toString();
      return {
        timeEntryId: entryId,
        projectId: type === ProjectType.trello ? strId : null,
        taskId: type === ProjectType.task ? parseInt(strId, 10) : null,
        projectType: type,
      };
    }),
  };

  const args: TimeEntryUpdateArgs = {
    where: {
      id: entryId,
    },
    data: {
      start: entry.start,
      end: entry.end,
    },
  };

  return yield* prisma.$transaction(
    Effect.gen(function* () {
      yield* prisma.timeEntryProject.deleteMany(deleteTimeEntryProjectArgs);
      yield* prisma.timeEntryProject.createMany(createManyTimeEntryProjectArgs);
      return yield* prisma.timeEntry.update(args);
    }),
  );
});
