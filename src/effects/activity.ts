import { Effect } from "effect";

import type { PrismaService } from "@/generated/effect-prisma";
import type {
  FrozenWeekFindFirstArgs,
  WeeklyKilometrageFindFirstArgs,
  WeeklyObjectiveFindFirstArgs,
} from "@/generated/prisma/models";
import { assertEmployeeAccess } from "@/effects/auth";
import { buildActivityEvents } from "@/lib/activity";
import type { DateKey } from "@/lib/calendar";
import { getWeek, localDateFromKey, toUTCDate } from "@/lib/time";
import { timeEntryInclude } from "@/schemas/timeEntries.schemas";

export const getEmployeeActivityEffect = Effect.fn("getEmployeeActivity")(
  function* (prisma: PrismaService, employeeId: number, weekStartKey: DateKey) {
    yield* assertEmployeeAccess(employeeId);
    yield* Effect.annotateLogsScoped({ employeeId });

    const { startDate, endDate } = getWeek(localDateFromKey(weekStartKey));
    const weekStart = toUTCDate(startDate);
    const weekWhere = { employeeId, weekStart };

    const entriesArgs = {
      where: { employeeId, start: { gte: startDate, lte: endDate } },
      include: timeEntryInclude,
    };
    const frozenWeekArgs: FrozenWeekFindFirstArgs = { where: weekWhere };
    const objectiveArgs: WeeklyObjectiveFindFirstArgs = {
      where: { ...weekWhere, isDeleted: false },
    };
    const kilometrageArgs: WeeklyKilometrageFindFirstArgs = {
      where: { ...weekWhere, isDeleted: false },
    };

    const { entries, frozenWeek, objective, kilometrage } = yield* Effect.all(
      {
        entries: prisma.timeEntry.findMany(entriesArgs),
        frozenWeek: prisma.frozenWeek.findFirst(frozenWeekArgs),
        objective: prisma.weeklyObjective.findFirst(objectiveArgs),
        kilometrage: prisma.weeklyKilometrage.findFirst(kilometrageArgs),
      },
      { concurrency: "unbounded" },
    );

    return buildActivityEvents({
      entries,
      frozenWeek,
      objective,
      kilometrage: kilometrage?.kilometrage ?? 0,
    });
  },
);
