"use server";

import "server-only";

import { cache } from "react";

import prisma from "@/lib/prisma";
import {
  FrozenWeekFindManyArgs,
  FrozenWeekUpsertArgs,
} from "@/generated/prisma/models";

import {
  type FreezeWeekFormState,
  FreezeWeekFormSchema,
} from "./frozenWeeks.schemas";
import { restrictToRole } from "./auth";
import { FrozenWeek } from "@/generated/prisma/client";
import { Role } from "@/generated/prisma/enums";

export const putFreezeWeek = async (payload: Partial<FrozenWeek>) => {
  const { employeeId, weekStart, ...data } = payload;
  if (!employeeId || !weekStart) {
    throw new Error(`Missing employeeId or weekStart`);
  }
  const upsertFrozenWeek = async () => {
    const args: FrozenWeekUpsertArgs = {
      where: {
        employeeId_weekStart: {
          employeeId,
          weekStart,
        },
      },
      update: data,
      create: {
        employeeId,
        weekStart,
        weekTotal: data.weekTotal || 0,
        objective: data.objective || 40,
      },
    };
    return await prisma.frozenWeek.upsert(args);
  };
  return data.isDeleted
    ? restrictToRole(Role.manager, upsertFrozenWeek)
    : restrictToRole(Role.employee, upsertFrozenWeek);
};

export const getFrozenWeeks = cache(async (employeeId: number) =>
  restrictToRole(Role.employee, async () => {
    const args: FrozenWeekFindManyArgs = {
      where: {
        employeeId,
        isDeleted: false,
      },
    };
    return await prisma.frozenWeek.findMany(args);
  }),
);

export const freezeWeek = async (
  formState: FreezeWeekFormState,
  formData: FormData,
): Promise<FreezeWeekFormState> =>
  restrictToRole(Role.employee, async () => {
    const validatedFields = FreezeWeekFormSchema.safeParse({
      employeeId: formData.get("employeeId"),
      weekStart: formData.get("weekStart"),
      weekTotal: formData.get("weekTotal"),
      objective: formData.get("objective"),
      frozen: formData.get("frozen"),
    });
    const { success, data, error } = validatedFields;
    if (!success) {
      return {
        errors: {
          ...validatedFields.error.flatten().fieldErrors,
          schemaValidation: error.toString(),
        },
      };
    }

    const {
      employeeId,
      weekStart: strWeekStart,
      weekTotal: strWeekTotal,
      objective: strObjective,
      frozen,
      ...rest
    } = data;

    const weekStart = new Date(strWeekStart);
    const weekTotal = parseFloat(strWeekTotal);
    const objective = parseFloat(strObjective);

    const isFrozen = frozen === "1";
    if (isFrozen) {
      // unfreezing
      await restrictToRole(Role.manager, () => Promise.resolve());
    } else {
      // freezing
      if (Math.abs(weekTotal - objective) > 0.5) {
        return {
          errors: {
            dataValidation: `Impossible de geler: ${weekTotal.toFixed(2)}h enregistrées vs ${objective}h objectif (écart max: ±0.5h)`,
          },
        };
      }
    }
    await putFreezeWeek({
      employeeId: parseInt(employeeId, 10),
      weekStart,
      weekTotal,
      objective,
      ...rest,
      isDeleted: isFrozen,
    });
    return {
      message: isFrozen ? "unfreezeSuccess" : "freezeSuccess",
    };
  });
