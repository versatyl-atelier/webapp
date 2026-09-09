"use server";

import "server-only";

import {
  TimeEntryDeleteArgs,
  TimeEntryFindFirstArgs,
  TimeEntryGetPayload,
  TimeEntryProjectCreateManyArgs,
  TimeEntryProjectDeleteManyArgs,
  TimeEntryUpdateArgs,
  TimeEntryWhereInput,
} from "@/generated/prisma/models";

import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";

import { Effect } from "effect";
import { parseTimeToSeconds, secondsToHours } from "@/lib/time";
import { runEffectAsFormAction } from "@/lib/effect";

import {
  type EditTimeEntryFormState,
  type EditTimeEntryFormErrors,
  EditTimeEntryFormSchema,
} from "./timeEntries.schemas";
import { Role, TimeEntry } from "@/generated/prisma/client";
import { ProjectType } from "@/generated/prisma/client";
import { parseItemKey } from "@/lib/itemKey";
import { ProjectOrTask } from "@/components/ProjectSelect";
import { cachedGetter, protectedEffect } from "@/lib/effect";
import type { PrismaService } from "@/generated/effect-prisma";
import {
  assertWeekNotFrozen,
  WEEK_FROZEN_MESSAGE,
} from "@/app/effects/frozenWeeks";

type DateRange = {
  startDate: string;
  endDate: string;
};

const timeEntryInclude = {
  projects: {
    include: {
      project: {
        select: { name: true },
      },
      task: {
        select: { name: true },
      },
    },
  },
};

export type TimeEntryWithRelations = TimeEntryGetPayload<{
  include: typeof timeEntryInclude;
}>;

export const getTimeEntries = cachedGetter(
  Effect.fn("getTimeEntries")(function* (
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
  }),
  Role.employee,
);

export async function editTimeEntry(
  formState: EditTimeEntryFormState,
  formData: FormData,
): Promise<EditTimeEntryFormState> {
  return runEffectAsFormAction<
    EditTimeEntryFormState,
    typeof EditTimeEntryFormSchema,
    EditTimeEntryFormErrors
  >(
    formState,
    formData,
    EditTimeEntryFormSchema,
    Effect.fn("editTimeEntry")(function* (
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
      return yield* Effect.gen(function* () {
        const entryId = parseInt(String(timeEntryId), 10);
        const findArgs: TimeEntryFindFirstArgs = {
          where: { id: entryId, isDeleted: false },
        };
        const existingEntry = yield* prisma.timeEntry.findFirst(findArgs);

        if (existingEntry?.employeeId) {
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
                    id:
                      type === ProjectType.trello ? strId : parseInt(strId, 10),
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
      }).pipe(
        // TODO Any way to avoid this duplication across all the form actions?
        Effect.catchTag("WeekFrozenError", () =>
          Effect.succeed({
            errors: { dataValidation: WEEK_FROZEN_MESSAGE },
          }),
        ),
      );
    }),
    Role.employee,
  );
}

export const putTimeEntry = protectedEffect(
  Effect.fn("putTimeEntry")(function* (
    prisma: PrismaService,
    entry: Partial<TimeEntry> & {
      projects: ProjectOrTask[];
    },
  ) {
    if (!entry.id || !entry.projects) {
      return null; // TODO Fail more informatively?
    }
    const entryId = entry.id;

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
        yield* prisma.timeEntryProject.createMany(
          createManyTimeEntryProjectArgs,
        );
        return yield* prisma.timeEntry.update(args);
      }),
    );
  }),
  Role.employee,
);

export const deleteTimeEntry = protectedEffect(
  Effect.fn("deleteTimeEntry")(function* (
    prisma: PrismaService,
    entryId: number,
  ) {
    const args: TimeEntryDeleteArgs = {
      where: {
        id: entryId,
      },
    };
    return yield* prisma.timeEntry.delete(args);
  }),
  Role.employee,
);
