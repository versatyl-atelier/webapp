"use server";

import "server-only";

import prisma from "@/lib/prisma";
import type { WeeklyKilometrageFindFirstArgs } from "@/generated/prisma/models";
import { cachedGetter } from "@/lib/effect";
import { Effect } from "effect";
import { Role } from "@/generated/prisma/enums";
import { toUTCDate } from "@/lib/time";

export const getWeeklyKilometrage = cachedGetter(
  (employeeId: number, weekStart: Date) =>
    Effect.gen(function* () {
      const args: WeeklyKilometrageFindFirstArgs = {
        where: {
          employeeId,
          weekStart: toUTCDate(weekStart),
          isDeleted: false,
        },
      };
      return prisma.weeklyKilometrage.findFirst(args);
    }),
  Role.employee,
);
