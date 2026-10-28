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
  type MoveTimeEntryFormState,
} from "@/schemas/timeEntries.schemas";

import { INVALID_DATE_MESSAGE } from "@/constants/calendar";
import {
  ACTIVE_PUNCH_NOT_MOVABLE_MESSAGE,
  COPY_ENTRY_METHOD,
  ENTRY_COPIED_MESSAGE,
  ENTRY_MOVED_MESSAGE,
  ENTRY_NOT_FOUND_MESSAGE,
  MOVE_COMMAND,
  PROJECT_REQUIRED_MESSAGE,
} from "@/constants/timeEntries";
import { isDateKey } from "@/lib/calendar";
import { parseItemKey } from "@/lib/itemKey";
import { secondsToHours, parseTimeToSeconds, shiftToDay } from "@/lib/time";
import { assertEmployeeAccess } from "@/effects/auth";
import { assertWeekNotFrozen, handleWeekFrozen } from "@/effects/frozenWeeks";
import { ProjectOrTask } from "@/components/ProjectSelect";

const LUNCH_TASK_NAME = "Dîner";
const LUNCH_HOURS = 0.5;

const assertTimeEntryAccess = Effect.fn("assertTimeEntryAccess")(function* (
  prisma: PrismaService,
  entryId: number,
) {
  const args: TimeEntryFindFirstArgs = {
    where: { id: entryId },
    select: { employeeId: true },
  };
  const entry = yield* prisma.timeEntry.findFirst(args);
  yield* assertEmployeeAccess(entry?.employeeId ?? null);
});

export const deleteTimeEntryEffect = Effect.fn("deleteTimeEntry")(function* (
  prisma: PrismaService,
  entryId: number,
) {
  yield* Effect.annotateLogsScoped({ timeEntryId: entryId });
  yield* assertTimeEntryAccess(prisma, entryId);
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
  yield* assertEmployeeAccess(employeeId);
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
      date,
      command,
    }: Record<string, FormDataEntryValue | null>,
  ) {
    const entryId = parseInt(String(timeEntryId), 10);
    yield* Effect.annotateLogsScoped({ timeEntryId: entryId });

    if (date && !isDateKey(String(date))) {
      return { errors: { date: [INVALID_DATE_MESSAGE] } };
    }
    const targetDay = date ? dayBounds(String(date)).dayStart : null;

    const findArgs: TimeEntryFindFirstArgs = {
      where: { id: entryId, isDeleted: false },
    };
    const existingEntry = yield* prisma.timeEntry.findFirst(findArgs);

    yield* assertEmployeeAccess(existingEntry?.employeeId ?? null);
    if (existingEntry?.employeeId) {
      yield* Effect.annotateLogsScoped({
        employeeId: existingEntry.employeeId,
      });
      yield* assertWeekNotFrozen(
        prisma,
        existingEntry.employeeId,
        existingEntry.start,
      );
      if (targetDay) {
        yield* assertWeekNotFrozen(prisma, existingEntry.employeeId, targetDay);
      }
    }

    switch (command) {
      case "save": {
        const hourValue = secondsToHours(parseTimeToSeconds(String(hours)));
        const currentStart = new Date(String(startTime));
        const start = targetDay
          ? shiftToDay(currentStart, targetDay)
          : currentStart;
        const end = new Date(start.getTime() + hourValue * 3600000);
        const { id, type } = parseItemKey(String(projectId));
        if (!id) {
          return { errors: { projectId: [PROJECT_REQUIRED_MESSAGE] } };
        }
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
  yield* assertTimeEntryAccess(prisma, entryId);

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
    yield* assertEmployeeAccess(id);
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

export const moveTimeEntryEffect = Effect.fn("moveTimeEntry")(
  function* (
    prisma: PrismaService,
    _formState: MoveTimeEntryFormState,
    { timeEntryId, date, command }: Record<string, FormDataEntryValue | null>,
  ) {
    const entryId = parseInt(String(timeEntryId), 10);
    yield* Effect.annotateLogsScoped({ timeEntryId: entryId, command });

    if (!isDateKey(String(date))) {
      return { errors: { date: [INVALID_DATE_MESSAGE] } };
    }

    const entry = yield* prisma.timeEntry.findFirst({
      where: { id: entryId, isDeleted: false },
      include: { projects: true },
    });
    yield* assertEmployeeAccess(entry?.employeeId ?? null);
    if (!entry?.employeeId) {
      return { errors: { timeEntryId: [ENTRY_NOT_FOUND_MESSAGE] } };
    }
    if (!entry.end) {
      return { errors: { timeEntryId: [ACTIVE_PUNCH_NOT_MOVABLE_MESSAGE] } };
    }
    const { employeeId } = entry;
    yield* Effect.annotateLogsScoped({ employeeId });

    const { dayStart } = dayBounds(String(date));
    yield* assertWeekNotFrozen(prisma, employeeId, dayStart);

    const start = shiftToDay(entry.start, dayStart);
    const end = new Date(
      start.getTime() + (entry.end.getTime() - entry.start.getTime()),
    );

    if (command === MOVE_COMMAND) {
      if (start.getTime() === entry.start.getTime()) {
        return {};
      }
      yield* assertWeekNotFrozen(prisma, employeeId, entry.start);
      const updateArgs: TimeEntryUpdateArgs = {
        where: { id: entryId },
        data: { start, end },
      };
      yield* prisma.timeEntry.update(updateArgs);
      return { message: ENTRY_MOVED_MESSAGE };
    }

    yield* prisma.$transaction(
      Effect.gen(function* () {
        const createArgs: TimeEntryCreateArgs = {
          data: {
            employeeId,
            start,
            end,
            subtaskId: entry.subtaskId,
            entryMethod: COPY_ENTRY_METHOD,
          },
        };
        const copy = yield* prisma.timeEntry.create(createArgs);
        const createProjectsArgs: TimeEntryProjectCreateManyArgs = {
          data: entry.projects.map(({ projectId, taskId, projectType }) => ({
            timeEntryId: copy.id,
            projectId,
            taskId,
            projectType,
          })),
        };
        yield* prisma.timeEntryProject.createMany(createProjectsArgs);
      }),
    );
    return { message: ENTRY_COPIED_MESSAGE };
  },
  Effect.catchTag("WeekFrozenError", handleWeekFrozen),
);
