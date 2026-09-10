import type { PrismaService } from "@/generated/effect-prisma";
import {
  EmployeeUpdateArgs,
  WeeklyObjectiveUpsertArgs,
  WeeklyKilometrageUpsertArgs,
} from "@/generated/prisma/models";
import { parseTimeToSeconds, secondsToHours } from "@/lib/time";
import { Effect } from "effect";
import type { ObjectivesAndKilometrageFormState } from "@/schemas/objectivesAndKilometrage.schemas";
import { assertWeekNotFrozen, handleWeekFrozen } from "@/effects/frozenWeeks";

export const updateObjectivesAndKilometrageEffect = Effect.fn(
  "updateObjectivesAndKilometrage",
)(
  function* (
    prisma: PrismaService,
    _formState: ObjectivesAndKilometrageFormState,
    {
      employeeId,
      weekStart: strWeekStart,
      objective: strObjective,
      kilometrage: strKilometrage,
    }: Record<string, FormDataEntryValue | null>,
  ) {
    const employeeIdInt = parseInt(String(employeeId), 10);
    const weekStart = new Date(String(strWeekStart));
    yield* Effect.annotateLogsScoped({
      employeeId: employeeIdInt,
      weekStart: weekStart.toISOString(),
    });

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
  },
  Effect.catchTag("WeekFrozenError", handleWeekFrozen),
);
