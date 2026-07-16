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
import prisma from "@/lib/prisma";
import { parseTimeToSeconds, secondsToHours } from "@/lib/time";
import { runEffectAsFormAction } from "@/lib/effect";
import { Effect } from "effect";

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
    (
      formState: ObjectivesAndKilometrageFormState,
      {
        employeeId,
        weekStart: strWeekStart,
        objective: strObjective,
        kilometrage: strKilometrage,
      }: Record<string, FormDataEntryValue | null>,
    ) =>
      Effect.gen(function* () {
        const employeeIdInt = parseInt(String(employeeId), 10);
        const weekStart = new Date(String(strWeekStart));

        const objectiveSeconds = parseTimeToSeconds(String(strObjective));
        const objective = secondsToHours(objectiveSeconds);

        const kilometrage = parseFloat(String(strKilometrage)) || 0;

        if (objective < 5 || objective > 60) {
          yield* Effect.succeed({
            errors: {
              dataValidation: "Objectif doit être entre 5h et 60h",
            },
          });
        }

        if (kilometrage < 0) {
          yield* Effect.succeed({
            errors: {
              dataValidation: "Kilométrage ne peut pas être négatif",
            },
          });
        }

        const employeeUpdateArgs: EmployeeUpdateArgs = {
          where: { id: employeeIdInt },
          data: { weeklyTarget: objective },
        };
        yield* Effect.tryPromise(() =>
          prisma.employee.update(employeeUpdateArgs),
        );

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
        yield* Effect.tryPromise(() =>
          prisma.weeklyObjective.upsert(objectiveArgs),
        );

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
        yield* Effect.tryPromise(() =>
          prisma.weeklyKilometrage.upsert(kilometrageArgs),
        );

        return {
          message: "Objectif et kilométrage sauvegardés!",
        };
      }),
    Role.employee,
  );
}
