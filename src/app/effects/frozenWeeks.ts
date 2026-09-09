import { getMondayOfDate, toUTCDate } from "@/lib/time";
import { FrozenWeekFindFirstArgs } from "@/generated/prisma/models";
import type { PrismaService } from "@/generated/effect-prisma";
import { Data, Effect } from "effect";

export const WEEK_FROZEN_MESSAGE =
  "Cette semaine est gelée. Un gestionnaire doit la dégeler pour permettre des modifications.";

export class WeekFrozenError extends Data.TaggedError("WeekFrozenError")<{
  readonly employeeId: number;
  readonly weekStart: Date;
}> {}

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
