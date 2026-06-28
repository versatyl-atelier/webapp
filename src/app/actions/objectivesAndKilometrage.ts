"use server";

import "server-only";

import {
  EmployeeUpdateArgs,
  WeeklyKilometrageUpsertArgs,
  WeeklyObjectiveUpsertArgs,
} from "@/generated/prisma/models";

import {
  type ObjectivesAndKilometrageFormState,
  ObjectivesAndKilometrageFormSchema,
} from "./objectivesAndKilometrage.schemas";
import { restrictToRole } from "./auth";
import { Role } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { parseTimeToSeconds, secondsToHours } from "@/lib/parseTimeToSeconds";

export const updateObjectivesAndKilometrage = async (
  formState: ObjectivesAndKilometrageFormState,
  formData: FormData,
): Promise<ObjectivesAndKilometrageFormState> =>
  restrictToRole(Role.employee, async () => {
    const validatedFields = ObjectivesAndKilometrageFormSchema.safeParse({
      employeeId: formData.get("employeeId"),
      weekStart: formData.get("weekStart"),
      objective: formData.get("objective"),
      kilometrage: formData.get("kilometrage"),
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
      objective: strObjective,
      kilometrage: strKilometrage,
    } = data;
    const employeeIdInt = parseInt(employeeId, 10);
    const weekStart = new Date(strWeekStart);

    const objectiveSeconds = parseTimeToSeconds(strObjective);
    const objective = secondsToHours(objectiveSeconds);

    const kilometrage = parseFloat(strKilometrage) || 0;

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

    const employeeUpdateArgs: EmployeeUpdateArgs = {
      where: { id: employeeIdInt },
      data: { weeklyTarget: objective },
    };
    await prisma.employee.update(employeeUpdateArgs);

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
    await prisma.weeklyObjective.upsert(objectiveArgs);

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
    await prisma.weeklyKilometrage.upsert(kilometrageArgs);

    return {
      message: "Objectif et kilométrage sauvegardés!",
    };
  });
