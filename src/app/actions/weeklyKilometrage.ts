"use server";

import "server-only";

import { PrismaService } from "@/generated/effect-prisma";
import type { WeeklyKilometrageFindFirstArgs } from "@/generated/prisma/models";
import { cachedGetter } from "@/lib/effect";
import { Role } from "@/generated/prisma/enums";
import { toUTCDate } from "@/lib/time";

export const getWeeklyKilometrage = cachedGetter(function* (
  employeeId: number,
  weekStart: Date,
) {
  const prisma = yield* PrismaService;
  const args: WeeklyKilometrageFindFirstArgs = {
    where: {
      employeeId,
      weekStart: toUTCDate(weekStart),
      isDeleted: false,
    },
  };
  return yield* prisma.weeklyKilometrage.findFirst(args);
}, Role.employee);
