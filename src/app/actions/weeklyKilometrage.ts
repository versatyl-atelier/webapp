"use server";

import "server-only";

import type { WeeklyKilometrageFindFirstArgs } from "@/generated/prisma/models";
import { cachedGetter } from "@/lib/effect";
import { Role } from "@/generated/prisma/enums";
import { toUTCDate } from "@/lib/time";
import type { PrismaService } from "@/generated/effect-prisma";
import { Effect } from "effect";

export const getWeeklyKilometrage = cachedGetter(
  Effect.fn("getWeeklyKilometrage")(function* (
    prisma: PrismaService,
    employeeId: number,
    weekStart: Date,
  ) {
    const args: WeeklyKilometrageFindFirstArgs = {
      where: {
        employeeId,
        weekStart: toUTCDate(weekStart),
        isDeleted: false,
      },
    };
    return yield* prisma.weeklyKilometrage.findFirst(args);
  }),
  Role.employee,
);
