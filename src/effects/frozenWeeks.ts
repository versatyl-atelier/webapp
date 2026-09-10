import { getMondayOfDate, toUTCDate } from "@/lib/time";
import {
  FrozenWeekFindFirstArgs,
  FrozenWeekFindManyArgs,
  FrozenWeekUpsertArgs,
} from "@/generated/prisma/models";
import type { PrismaService } from "@/generated/effect-prisma";
import { Effect } from "effect";
import { Role } from "@/generated/prisma/enums";
import { verifySession } from "@/effects/auth";
import {
  WEEK_FROZEN_MESSAGE,
  WeekFrozenError,
} from "@/schemas/frozenWeeks.schemas";

export const handleWeekFrozen = () =>
  Effect.succeed({
    errors: { dataValidation: WEEK_FROZEN_MESSAGE },
  });

export const assertWeekNotFrozen = Effect.fn("assertWeekNotFrozen")(function* (
  prisma: PrismaService,
  employeeId: number,
  date: Date,
) {
  const weekStart = toUTCDate(getMondayOfDate(date));
  const args: FrozenWeekFindFirstArgs = {
    where: {
      employeeId,
      weekStart,
      isDeleted: false,
    },
  };
  const frozenWeek = yield* prisma.frozenWeek.findFirst(args);
  if (frozenWeek) {
    return yield* new WeekFrozenError({ employeeId, weekStart });
  }
});

export const getFrozenWeeksEffect = Effect.fn("getFrozenWeeks")(function* (
  prisma: PrismaService,
  employeeId: number,
) {
  const args: FrozenWeekFindManyArgs = {
    where: {
      employeeId,
      isDeleted: false,
    },
  };
  return yield* prisma.frozenWeek.findMany(args);
});

export const freezeWeekEffect = Effect.fn("freezeWeek")(function* (
  prisma: PrismaService,
  _formState,
  {
    employeeId: strEmployeeId,
    weekStart: strWeekStart,
    weekTotal: strWeekTotal,
    objective: strObjective,
    frozen,
  },
) {
  const employeeId = parseInt(strEmployeeId, 10);
  const weekStart = new Date(String(strWeekStart));
  yield* Effect.annotateLogsScoped({
    employeeId,
    weekStart: weekStart.toISOString(),
  });
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
});
