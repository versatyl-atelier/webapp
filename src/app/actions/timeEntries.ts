"use server";

import { unauthorized } from "next/navigation";
import { cache } from "react";

import {
  TimeEntryDeleteArgs,
  TimeEntryGetPayload,
  TimeEntryUpdateArgs,
  TimeEntryWhereInput,
} from "@/generated/prisma/models";

import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";

import { parseTimeToSeconds, secondsToHours } from "@/lib/parseTimeToSeconds";
import prisma from "@/lib/prisma";

import {
  type EditTimeEntryFormState,
  EditTimeEntryFormSchema,
} from "./timeEntries.schemas";
import { restrictToRole, verifySession } from "./auth";
import { Role, TimeEntry } from "@/generated/prisma/client";

type DateRange = {
  startDate: string;
  endDate: string;
};

const timeEntryInclude = {
  project: {
    select: {
      name: true,
    },
  },
  task: {
    select: {
      name: true,
    },
  },
} as const;

export type TimeEntryWithRelations = TimeEntryGetPayload<{
  include: typeof timeEntryInclude;
}>;

export const getTimeEntries = cache(
  async (employeeId: number, { startDate, endDate }: DateRange) =>
    restrictToRole(Role.employee, async () => {
      const where: TimeEntryWhereInput = {
        employeeId,
        isDeleted: false,
      };

      if (startDate || endDate) {
        where.date = {};
        if (startDate) {
          where.date.gte = new Date(startDate);
        }
        if (endDate) {
          where.date.lte = new Date(endDate);
        }
      }
      const args = {
        include: timeEntryInclude,
        where,
        orderBy: [{ date: SortOrder.desc }, { id: SortOrder.asc }],
      };
      return await prisma.timeEntry.findMany(args);
    }),
);

export async function editTimeEntry(
  formState: EditTimeEntryFormState,
  formData: FormData,
): Promise<EditTimeEntryFormState> {
  const validatedFields = EditTimeEntryFormSchema.safeParse({
    timeEntryId: formData.get("timeEntryId"),
    projectId: formData.get("projectId"),
    hours: formData.get("hours"),
    command: formData.get("command"),
  });
  const { success, data, error } = validatedFields;
  if (!success) {
    console.error(error);
    return {
      errors: { ...validatedFields.error.flatten().fieldErrors },
    };
  }

  const { timeEntryId, projectId, hours, command } = data;
  switch (command) {
    case "save":
      await putTimeEntry({
        id: parseInt(timeEntryId, 10),
        projectId,
        hours: secondsToHours(parseTimeToSeconds(hours)),
      });
      return {
        message: "Sauvegardé",
      };
    case "delete":
      await deleteTimeEntry(parseInt(timeEntryId, 10));
      return {
        message: "Supprimé",
      };
    default:
      throw new Error(`Unhandled \`editTimeEntry\` command: ${command}`);
  }
}

export const putTimeEntry = async (entry: Partial<TimeEntry>) =>
  restrictToRole(Role.employee, async () => {
    if (!entry.projectId) {
      return null; // TODO Fail more informatively?
    }
    const [projectType, id] = entry.projectId.split("-");
    const args: TimeEntryUpdateArgs = {
      where: {
        id: entry.id,
      },
      data: {
        projectType: projectType === "trello" ? "TRELLO" : "TASK",
        projectId: projectType === "trello" ? id : null,
        taskId: projectType === "task" ? parseInt(id, 10) : null,
        hours: entry.hours,
      },
    };
    return await prisma.timeEntry.update(args);
  });

export const deleteTimeEntry = async (entryId: number) =>
  restrictToRole(Role.employee, async () => {
    const args: TimeEntryDeleteArgs = {
      where: {
        id: entryId,
      },
    };
    return await prisma.timeEntry.delete(args);
  });
