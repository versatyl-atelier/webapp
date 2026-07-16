"use server";

import "server-only";

import {
  TimeEntryDeleteArgs,
  TimeEntryGetPayload,
  TimeEntryProjectCreateManyArgs,
  TimeEntryProjectDeleteManyArgs,
  TimeEntryUpdateArgs,
  TimeEntryWhereInput,
} from "@/generated/prisma/models";

import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";

import { Effect } from "effect";
import { parseTimeToSeconds, secondsToHours } from "@/lib/time";
import prisma from "@/lib/prisma";
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
  (employeeId: number, { startDate, endDate }: DateRange) =>
    Effect.gen(function* () {
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
      return prisma.timeEntry.findMany(args);
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
    (_formState, { timeEntryId, projectId, startTime, hours, command }) =>
      Effect.gen(function* () {
        switch (command) {
          case "save": {
            const hourValue = secondsToHours(parseTimeToSeconds(String(hours)));
            const start = new Date(String(startTime));
            const end = new Date(start.getTime() + hourValue * 3600000);
            const { id, type } = parseItemKey(String(projectId));
            const strId = id.toString();
            yield* Effect.tryPromise(() =>
              putTimeEntry({
                id: parseInt(String(timeEntryId), 10),
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
            yield* Effect.tryPromise(() =>
              deleteTimeEntry(parseInt(String(timeEntryId), 10)),
            );
            return {
              message: "Supprimé",
            };
          default:
            throw new Error(`Unhandled \`editTimeEntry\` command: ${command}`);
        }
      }),
    Role.employee,
  );
}

export const putTimeEntry = protectedEffect(
  (
    entry: Partial<TimeEntry> & {
      projects: ProjectOrTask[];
    },
  ) =>
    Effect.gen(function* () {
      if (!entry.id || !entry.projects) {
        return yield* Effect.succeed(null); // TODO Fail more informatively?
      }

      const deleteTimeEntryProjectArgs: TimeEntryProjectDeleteManyArgs = {
        where: {
          timeEntryId: entry.id,
        },
      };
      yield* Effect.tryPromise(() =>
        prisma.timeEntryProject.deleteMany(deleteTimeEntryProjectArgs),
      );

      if (entry.id) {
        const createManyTimeEntryProjectArgs: TimeEntryProjectCreateManyArgs = {
          data: entry.projects.map(({ id, type }) => {
            const strId = id.toString();
            return {
              timeEntryId: entry.id || -1,
              projectId: type === ProjectType.trello ? strId : null,
              taskId: type === ProjectType.task ? parseInt(strId, 10) : null,
              projectType: type,
            };
          }),
        };

        yield* Effect.tryPromise(() =>
          prisma.timeEntryProject.createMany(createManyTimeEntryProjectArgs),
        );
      }

      const args: TimeEntryUpdateArgs = {
        where: {
          id: entry.id,
        },
        data: {
          start: entry.start,
          end: entry.end,
        },
      };
      return prisma.timeEntry.update(args);
    }),
  Role.employee,
);

export const deleteTimeEntry = protectedEffect(
  (entryId: number) =>
    Effect.gen(function* () {
      const args: TimeEntryDeleteArgs = {
        where: {
          id: entryId,
        },
      };
      return prisma.timeEntry.delete(args);
    }),
  Role.employee,
);
