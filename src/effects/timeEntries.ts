import { Effect } from "effect";

import type { PrismaService } from "@/generated/effect-prisma";
import { TimeEntry, TimeEntryProject } from "@/generated/prisma/client";
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
  type MoveTimeEntryUndo,
} from "@/schemas/timeEntries.schemas";

import { INVALID_DATE_MESSAGE } from "@/constants/calendar";
import {
  DEFAULT_SUBTASK_ID,
  LUNCH_TASK_NAME,
  SUBTASK_NOT_FOUND_MESSAGE,
} from "@/constants/tasks";
import {
  ACTIVE_PUNCH_NOT_MOVABLE_MESSAGE,
  COPY_COMMAND,
  COPY_ENTRY_METHOD,
  COPY_UNDONE_MESSAGE,
  DELETE_COMMAND,
  ENTRY_COPIED_MESSAGE,
  ENTRY_DELETED_MESSAGE,
  ENTRY_MOVED_MESSAGE,
  ENTRY_NOT_FOUND_MESSAGE,
  MOVE_COMMAND,
  MOVE_UNDONE_MESSAGE,
  PROJECT_REQUIRED_MESSAGE,
  UNDO_COPY_COMMAND,
  UNDO_MOVE_COMMAND,
} from "@/constants/timeEntries";
import { isDateKey } from "@/lib/calendar";
import { parseItemKey } from "@/lib/itemKey";
import { secondsToHours, parseTimeToSeconds, shiftToDay } from "@/lib/time";
import { assertEmployeeAccess } from "@/effects/auth";
import { assertWeekNotFrozen, handleWeekFrozen } from "@/effects/frozenWeeks";
import { ProjectOrTask } from "@/components/ProjectSelect";

const LUNCH_HOURS = 0.5;

type TimeEntryCopy = Pick<TimeEntry, "employeeId" | "start" | "end"> & {
  subtaskId: string;
  projects: Pick<TimeEntryProject, "projectId" | "taskId" | "projectType">[];
};

const createTimeEntryCopy = Effect.fn("createTimeEntryCopy")(function* (
  prisma: PrismaService,
  { employeeId, start, end, subtaskId, projects }: TimeEntryCopy,
) {
  return yield* prisma.$transaction(
    Effect.gen(function* () {
      const createArgs: TimeEntryCreateArgs = {
        data: {
          employeeId,
          start,
          end,
          subtaskId,
          entryMethod: COPY_ENTRY_METHOD,
        },
      };
      const copy = yield* prisma.timeEntry.create(createArgs);
      const createProjectsArgs: TimeEntryProjectCreateManyArgs = {
        data: projects.map(({ projectId, taskId, projectType }) => ({
          timeEntryId: copy.id,
          projectId,
          taskId,
          projectType,
        })),
      };
      yield* prisma.timeEntryProject.createMany(createProjectsArgs);
      return copy;
    }),
  );
});

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
      subtaskId,
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
      if (command !== COPY_COMMAND) {
        yield* assertWeekNotFrozen(
          prisma,
          existingEntry.employeeId,
          existingEntry.start,
        );
      }
      yield* assertWeekNotFrozen(
        prisma,
        existingEntry.employeeId,
        targetDay ?? existingEntry.start,
      );
    }

    switch (command) {
      case "save":
      case COPY_COMMAND: {
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
        const entrySubtaskId =
          type === ProjectType.trello && subtaskId
            ? String(subtaskId)
            : DEFAULT_SUBTASK_ID;
        const subtask = yield* prisma.subtask.findFirst({
          where: { id: entrySubtaskId, isDeleted: false },
        });
        if (!subtask) {
          return { errors: { subtaskId: [SUBTASK_NOT_FOUND_MESSAGE] } };
        }
        if (command === COPY_COMMAND) {
          if (!existingEntry?.employeeId) {
            return { errors: { timeEntryId: [ENTRY_NOT_FOUND_MESSAGE] } };
          }
          yield* createTimeEntryCopy(prisma, {
            employeeId: existingEntry.employeeId,
            start,
            end,
            subtaskId: entrySubtaskId,
            projects: [
              {
                projectType: type,
                projectId: type === ProjectType.trello ? strId : null,
                taskId: type === ProjectType.task ? parseInt(strId, 10) : null,
              },
            ],
          });
          return { message: ENTRY_COPIED_MESSAGE };
        }
        yield* Effect.tryPromise(() =>
          putTimeEntry({
            id: entryId,
            start,
            end,
            subtaskId: entrySubtaskId,
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
      subtaskId: entry.subtaskId,
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
    {
      timeEntryId,
      date,
      sourceDate,
      command,
    }: Record<string, FormDataEntryValue | null>,
  ) {
    const entryId = parseInt(String(timeEntryId), 10);
    yield* Effect.annotateLogsScoped({ timeEntryId: entryId, command });

    if (!isDateKey(String(date))) {
      return { errors: { date: [INVALID_DATE_MESSAGE] } };
    }
    if (sourceDate && !isDateKey(String(sourceDate))) {
      return { errors: { sourceDate: [INVALID_DATE_MESSAGE] } };
    }

    const entry = yield* prisma.timeEntry.findFirst({
      where: { id: entryId, isDeleted: false },
      include: { projects: true },
    });
    yield* assertEmployeeAccess(entry?.employeeId ?? null);
    if (!entry?.employeeId) {
      return { errors: { timeEntryId: [ENTRY_NOT_FOUND_MESSAGE] } };
    }
    const { employeeId } = entry;
    yield* Effect.annotateLogsScoped({ employeeId });

    if (command === DELETE_COMMAND) {
      yield* assertWeekNotFrozen(prisma, employeeId, entry.start);
      yield* deleteTimeEntryEffect(prisma, entryId);
      return { message: ENTRY_DELETED_MESSAGE };
    }

    if (command === UNDO_COPY_COMMAND) {
      if (entry.entryMethod !== COPY_ENTRY_METHOD) {
        return { errors: { timeEntryId: [ENTRY_NOT_FOUND_MESSAGE] } };
      }
      yield* assertWeekNotFrozen(prisma, employeeId, entry.start);
      yield* deleteTimeEntryEffect(prisma, entryId);
      return { message: COPY_UNDONE_MESSAGE };
    }

    if (!entry.end) {
      return { errors: { timeEntryId: [ACTIVE_PUNCH_NOT_MOVABLE_MESSAGE] } };
    }

    const { dayStart } = dayBounds(String(date));
    yield* assertWeekNotFrozen(prisma, employeeId, dayStart);

    const start = shiftToDay(entry.start, dayStart);
    const end = new Date(
      start.getTime() + (entry.end.getTime() - entry.start.getTime()),
    );

    if (command === MOVE_COMMAND || command === UNDO_MOVE_COMMAND) {
      if (start.getTime() === entry.start.getTime()) {
        return {};
      }
      yield* assertWeekNotFrozen(prisma, employeeId, entry.start);
      const updateArgs: TimeEntryUpdateArgs = {
        where: { id: entryId },
        data: { start, end },
      };
      yield* prisma.timeEntry.update(updateArgs);
      if (command === UNDO_MOVE_COMMAND) {
        return { message: MOVE_UNDONE_MESSAGE };
      }
      if (!sourceDate) {
        return { message: ENTRY_MOVED_MESSAGE };
      }
      const undo: MoveTimeEntryUndo = {
        timeEntryId: String(entryId),
        date: String(sourceDate),
        command: UNDO_MOVE_COMMAND,
      };
      return { message: ENTRY_MOVED_MESSAGE, undo };
    }

    const copy = yield* createTimeEntryCopy(prisma, {
      employeeId,
      start,
      end,
      subtaskId: entry.subtaskId,
      projects: entry.projects,
    });
    const undo: MoveTimeEntryUndo = {
      timeEntryId: String(copy.id),
      date: String(date),
      command: UNDO_COPY_COMMAND,
    };
    return { message: ENTRY_COPIED_MESSAGE, undo };
  },
  Effect.catchTag("WeekFrozenError", handleWeekFrozen),
);
