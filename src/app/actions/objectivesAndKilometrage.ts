"use server";

import "server-only";

import {
  EmployeeUpdateArgs,
  WeeklyKilometrageUpsertArgs,
  WeeklyObjectiveUpsertArgs,
} from "@/generated/prisma/models";

import {
  type ObjectivesAndKilometrageFormState,
  ObjectivesAndKilometrageFormErrors,
  ObjectivesAndKilometrageFormSchema,
} from "./objectivesAndKilometrage.schemas";
import { Role } from "@/generated/prisma/enums";
import { parseTimeToSeconds, secondsToHours } from "@/lib/time";
import { runEffectAsFormAction } from "@/lib/effect";
import { Effect } from "effect";
import type { PrismaService } from "@/generated/effect-prisma";
import {
  assertWeekNotFrozen,
  WEEK_FROZEN_MESSAGE,
} from "@/app/effects/frozenWeeks";

export async function updateObjectivesAndKilometrage(
  formState: ObjectivesAndKilometrageFormState,
  formData: FormData,
): Promise<ObjectivesAndKilometrageFormState> {
  return runEffectAsFormAction<
    ObjectivesAndKilometrageFormState,
    typeof ObjectivesAndKilometrageFormSchema,
    ObjectivesAndKilometrageFormErrors
  >(
    formState,
    formData,
    ObjectivesAndKilometrageFormSchema,
    Effect.fn("updateObjectivesAndKilometrage")(function* (
      prisma: PrismaService,
      formState: ObjectivesAndKilometrageFormState,
      {
        employeeId,
        weekStart: strWeekStart,
        objective: strObjective,
        kilometrage: strKilometrage,
      }: Record<string, FormDataEntryValue | null>,
    ) {
      const employeeIdInt = parseInt(String(employeeId), 10);
      const weekStart = new Date(String(strWeekStart));

      const objectiveSeconds = parseTimeToSeconds(String(strObjective));
      const objective = secondsToHours(objectiveSeconds);

      const kilometrage = parseFloat(String(strKilometrage)) || 0;

      if (objective < 5 || objective > 60) {
        return {
          errors: {
            dataValidation: "Objectif doit être entre 5h et 60h",
          },
        };
      }

      if (kilometrage < 0) {
        return {
          errors: {
            dataValidation: "Kilométrage ne peut pas être négatif",
          },
        };
      }

      return yield* Effect.gen(function* () {
        yield* assertWeekNotFrozen(prisma, employeeIdInt, weekStart);

        const employeeUpdateArgs: EmployeeUpdateArgs = {
          where: { id: employeeIdInt },
          data: { weeklyTarget: objective },
        };

        const objectiveArgs: WeeklyObjectiveUpsertArgs = {
          where: {
            employeeId_weekStart: {
              employeeId: employeeIdInt,
              weekStart,
            },
          },
          update: { objective },
          create: {
            employeeId: employeeIdInt,
            weekStart,
            objective,
          },
        };

        const kilometrageArgs: WeeklyKilometrageUpsertArgs = {
          where: {
            employeeId_weekStart: {
              employeeId: employeeIdInt,
              weekStart,
            },
          },
          update: { kilometrage },
          create: {
            employeeId: employeeIdInt,
            weekStart,
            kilometrage,
          },
        };

        yield* prisma.$transaction(
          Effect.gen(function* () {
            yield* prisma.employee.update(employeeUpdateArgs);
            yield* prisma.weeklyObjective.upsert(objectiveArgs);
            yield* prisma.weeklyKilometrage.upsert(kilometrageArgs);
          }),
        );

        return {
          message: "Objectif et kilométrage sauvegardés!",
        };
      }).pipe(
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
