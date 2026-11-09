import { Effect } from "effect";

import type { PrismaService } from "@/generated/effect-prisma";
import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import type {
  EmployeeFindManyArgs,
  FrozenWeekFindManyArgs,
  TimeEntryFindManyArgs,
  WeeklyKilometrageFindManyArgs,
  WeeklyObjectiveFindManyArgs,
} from "@/generated/prisma/models";
import { DAYS_PER_WEEK } from "@/constants/calendar";
import { addDays, toDbDate, type DateKey } from "@/lib/calendar";
import { DEFAULT_WEEKLY_TARGET } from "@/lib/employee-week";
import { getWeek, localDateFromKey } from "@/lib/time";
import { buildTimesheet } from "@/lib/timesheet";

export const getTimesheetEffect = Effect.fn("getTimesheet")(function* (
  prisma: PrismaService,
  firstWeekStart: DateKey,
  weekCount: number,
) {
  const weekStarts = Array.from({ length: weekCount }, (_, index) =>
    addDays(firstWeekStart, index * DAYS_PER_WEEK),
  );
  const lastWeekStart = weekStarts[weekStarts.length - 1];
  const dbWeekStarts = weekStarts.map(toDbDate);
  const weekWhere = { weekStart: { in: dbWeekStarts }, isDeleted: false };

  const employeesArgs: EmployeeFindManyArgs = {
    where: { isDeleted: false },
    orderBy: [{ displayOrder: SortOrder.asc }, { name: SortOrder.asc }],
  };
  const entriesArgs: TimeEntryFindManyArgs = {
    where: {
      isDeleted: false,
      end: { not: null },
      start: {
        gte: localDateFromKey(firstWeekStart),
        lte: getWeek(localDateFromKey(lastWeekStart)).endDate,
      },
    },
  };
  const objectivesArgs: WeeklyObjectiveFindManyArgs = { where: weekWhere };
  const kilometragesArgs: WeeklyKilometrageFindManyArgs = { where: weekWhere };
  const frozenWeeksArgs: FrozenWeekFindManyArgs = { where: weekWhere };

  const { employees, entries, objectives, kilometrages, frozenWeeks } =
    yield* Effect.all(
      {
        employees: prisma.employee.findMany(employeesArgs),
        entries: prisma.timeEntry.findMany(entriesArgs),
        objectives: prisma.weeklyObjective.findMany(objectivesArgs),
        kilometrages: prisma.weeklyKilometrage.findMany(kilometragesArgs),
        frozenWeeks: prisma.frozenWeek.findMany(frozenWeeksArgs),
      },
      { concurrency: "unbounded" },
    );

  return buildTimesheet({
    weekStarts,
    employees,
    entries,
    objectives,
    kilometrages,
    frozenWeeks,
    defaultObjective: DEFAULT_WEEKLY_TARGET,
  });
});
