"use server";

import "server-only";

import { PrismaService } from "@/generated/effect-prisma";
import { cachedGetter, runEffectAsFormAction } from "@/lib/effect";
import { toUTCDate } from "@/lib/time";
import {
  FrozenWeekFindManyArgs,
  FrozenWeekUpsertArgs,
} from "@/generated/prisma/models";

import {
  type FreezeWeekFormState,
  type FreezeWeekFormErrors,
  FreezeWeekFormSchema,
} from "./frozenWeeks.schemas";
import { FrozenWeek, Role } from "@/generated/prisma/client";
import { verifySession } from "../effects/auth";

export const getFrozenWeeks = cachedGetter(function* (employeeId: number) {
  const prisma = yield* PrismaService;
  const args: FrozenWeekFindManyArgs = {
    where: {
      employeeId,
      isDeleted: false,
    },
  };
  return yield* prisma.frozenWeek.findMany(args);
}, Role.employee);

export const freezeWeek = async (
  formState: FreezeWeekFormState,
  formData: FormData,
): Promise<FreezeWeekFormState> => {
  return runEffectAsFormAction<
    FreezeWeekFormState,
    typeof FreezeWeekFormSchema,
    FreezeWeekFormErrors
  >(
    formState,
    formData,
    FreezeWeekFormSchema,
    function* (
      _formState,
      {
        employeeId: strEmployeeId,
        weekStart: strWeekStart,
        weekTotal: strWeekTotal,
        objective: strObjective,
        frozen,
      },
    ) {
      const prisma = yield* PrismaService;
      const employeeId = parseInt(strEmployeeId, 10);
      const weekStart = new Date(String(strWeekStart));
      const weekTotal = parseFloat(String(strWeekTotal));
      const objective = parseFloat(String(strObjective));

      const isFrozen = frozen === "1";

      if (!isFrozen && Math.abs(weekTotal - objective) > 0.5) {
        return {
          errors: {
            dataValidation: `Impossible de geler: ${weekTotal.toFixed(2)}h enregistrées vs ${objective}h objectif (écart max: ±0.5h)`,
          },
        };
      }
      const isDeleted = isFrozen;

      if (!employeeId || !weekStart) {
        throw new Error(`Missing employeeId or weekStart`);
      }
      const args: FrozenWeekUpsertArgs = {
        where: {
          employeeId_weekStart: {
            employeeId,
            weekStart: toUTCDate(weekStart),
          },
        },
        update: {
          weekTotal,
          objective,
          isDeleted,
        },
        create: {
          employeeId,
          weekStart: toUTCDate(weekStart),
          weekTotal: weekTotal || 0,
          objective: objective || 40,
        },
      };
      if (isDeleted) {
        yield* verifySession(Role.manager);
      } else {
        yield* verifySession(Role.employee);
      }
      const result = yield* prisma.frozenWeek.upsert(args);
      if (!result) {
        return { message: "failure" };
      }
      return {
        message: isFrozen ? "unfreezeSuccess" : "freezeSuccess",
      };
    },
  );
};
