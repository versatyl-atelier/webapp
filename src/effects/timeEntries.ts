import { Effect } from "effect";

import type { PrismaService } from "@/generated/effect-prisma";
import { TimeEntry } from "@/generated/prisma/client";
import { ProjectType } from "@/generated/prisma/enums";
import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import {
  TaskFindFirstArgs,
  TimeEntryCreateArgs,
  TimeEntryDeleteArgs,
  TimeEntryFindFirstArgs,
  TimeEntryFindManyArgs,
  TimeEntryProjectCreateArgs,
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
  type AddManualTimeFormState,
  type FillDayFormState,
} from "@/schemas/timeEntries.schemas";

import { parseItemKey } from "@/lib/itemKey";
import {
  secondsToHours,
  parseTimeToSeconds,
  calculateHoursNeeded,
} from "@/lib/time";
import { assertWeekNotFrozen, handleWeekFrozen } from "@/effects/frozenWeeks";
import { ProjectOrTask } from "@/components/ProjectSelect";

const LUNCH_TASK_NAME = "Dîner";
const LUNCH_HOURS = 0.5;

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

function dayBounds(date: string) {
  const start = new Date(`${date}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { dayStart: start, dayEnd: end };
}

const getExistingHours = Effect.fn("getExistingHours")(function* (
  prisma: PrismaService,
  employeeId: number,
  date: string,
) {
  const { dayStart, dayEnd } = dayBounds(date);
  const args: TimeEntryFindManyArgs = {
    where: {
      employeeId,
      isDeleted: false,
      start: { gte: dayStart, lt: dayEnd },
    },
  };
  const entries = yield* prisma.timeEntry.findMany(args);
  return entries.reduce((sum, entry) => {
    if (!entry.end) return sum;
    return sum + (entry.end.getTime() - entry.start.getTime()) / 3600000;
  }, 0);
});

export const addManualTimeEffect = Effect.fn("addManualTime")(
  function* (
    prisma: PrismaService,
    _formState: AddManualTimeFormState,
    {
      employeeId,
      projectId,
      hours,
      date,
      command,
    }: Record<string, FormDataEntryValue | null>,
  ) {
    const id = parseInt(String(employeeId), 10);
    yield* Effect.annotateLogsScoped({ employeeId: id });

    const { dayStart } = dayBounds(String(date));
    yield* assertWeekNotFrozen(prisma, id, dayStart);

    if (command === "lunch") {
      const findTaskArgs: TaskFindFirstArgs = {
        where: { name: LUNCH_TASK_NAME, isDeleted: false },
      };
      const lunchTask = yield* prisma.task.findFirst(findTaskArgs);
      if (!lunchTask) {
        return {
          errors: { command: [`Tâche "${LUNCH_TASK_NAME}" introuvable`] },
        };
      }

      const start = dayStart;
      const end = new Date(start.getTime() + LUNCH_HOURS * 3600000);

      yield* prisma.$transaction(
        Effect.gen(function* () {
          const createArgs: TimeEntryCreateArgs = {
            data: { employeeId: id, start, end, entryMethod: "manual" },
          };
          const timeEntry = yield* prisma.timeEntry.create(createArgs);
          const createProjectArgs: TimeEntryProjectCreateArgs = {
            data: {
              timeEntryId: timeEntry.id,
              projectType: ProjectType.task,
              taskId: lunchTask.id,
            },
          };
          yield* prisma.timeEntryProject.create(createProjectArgs);
        }),
      );

      return { message: "Dîner ajouté" };
    }

    const hourValue = secondsToHours(parseTimeToSeconds(String(hours)));
    if (!hourValue || hourValue <= 0) {
      return { errors: { hours: ["Durée invalide"] } };
    }

    const { id: rawId, type } = parseItemKey(String(projectId));
    if (!rawId) {
      return { errors: { projectId: ["Projet requis"] } };
    }
    const strId = rawId.toString();

    const start = dayStart;
    const end = new Date(start.getTime() + hourValue * 3600000);

    yield* prisma.$transaction(
      Effect.gen(function* () {
        const createArgs: TimeEntryCreateArgs = {
          data: { employeeId: id, start, end, entryMethod: "manual" },
        };
        const timeEntry = yield* prisma.timeEntry.create(createArgs);
        const createProjectArgs: TimeEntryProjectCreateArgs = {
          data: {
            timeEntryId: timeEntry.id,
            projectType: type,
            projectId: type === ProjectType.trello ? strId : null,
            taskId: type === ProjectType.task ? parseInt(strId, 10) : null,
          },
        };
        yield* prisma.timeEntryProject.create(createProjectArgs);
      }),
    );

    return { message: "Ajouté" };
  },
  Effect.catchTag("WeekFrozenError", handleWeekFrozen),
);

export const fillDayEffect = Effect.fn("fillDay")(
  function* (
    prisma: PrismaService,
    _formState: FillDayFormState,
    {
      employeeId,
      projectId,
      target,
      date,
    }: Record<string, FormDataEntryValue | null>,
  ) {
    const id = parseInt(String(employeeId), 10);
    yield* Effect.annotateLogsScoped({ employeeId: id });

    const { dayStart } = dayBounds(String(date));
    yield* assertWeekNotFrozen(prisma, id, dayStart);

    const targetValue = secondsToHours(parseTimeToSeconds(String(target)));
    if (!targetValue) {
      return { errors: { target: ["Objectif invalide"] } };
    }

    const { id: rawId, type } = parseItemKey(String(projectId));
    if (!rawId) {
      return { errors: { projectId: ["Projet requis"] } };
    }
    const strId = rawId.toString();

    const existingHours = yield* getExistingHours(prisma, id, String(date));
    const hoursNeeded = calculateHoursNeeded(targetValue, existingHours);

    if (hoursNeeded <= 0) {
      return { errors: { target: ["Objectif déjà atteint"] } };
    }

    const start = dayStart;
    const end = new Date(start.getTime() + hoursNeeded * 3600000);

    yield* prisma.$transaction(
      Effect.gen(function* () {
        const createArgs: TimeEntryCreateArgs = {
          data: { employeeId: id, start, end, entryMethod: "fill" },
        };
        const timeEntry = yield* prisma.timeEntry.create(createArgs);
        const createProjectArgs: TimeEntryProjectCreateArgs = {
          data: {
            timeEntryId: timeEntry.id,
            projectType: type,
            projectId: type === ProjectType.trello ? strId : null,
            taskId: type === ProjectType.task ? parseInt(strId, 10) : null,
          },
        };
        yield* prisma.timeEntryProject.create(createProjectArgs);
      }),
    );

    return { message: "Comblé" };
  },
  Effect.catchTag("WeekFrozenError", handleWeekFrozen),
);
