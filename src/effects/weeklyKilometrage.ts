import type { PrismaService } from "@/generated/effect-prisma";
import type { WeeklyKilometrageFindFirstArgs } from "@/generated/prisma/models";
import { toUTCDate } from "@/lib/time";
import { Effect } from "effect";

export const getWeeklyKilometrageEffect = Effect.fn("getWeeklyKilometrage")(
  function* (prisma: PrismaService, employeeId: number, weekStart: Date) {
    const args: WeeklyKilometrageFindFirstArgs = {
      where: {
        employeeId,
        weekStart: toUTCDate(weekStart),
        isDeleted: false,
      },
    };
    return yield* prisma.weeklyKilometrage.findFirst(args);
  },
);
