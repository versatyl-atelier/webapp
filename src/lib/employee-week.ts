import "server-only";

import { getFrozenWeeks } from "@/actions/frozenWeeks";
import { getTimeEntries } from "@/actions/timeEntries";
import type { DateKey } from "@/lib/calendar";
import { getWeek, isSameUTCDate, localDateFromKey } from "@/lib/time";
import type { TimeEntryWithRelations } from "@/schemas/timeEntries.schemas";

export const DEFAULT_WEEKLY_TARGET = 40;
export const MAX_WEEKS_BACK = 3;

type WeekEmployee = {
  id: number;
  weeklyObjectives: { weekStart: Date; objective: number }[];
};

export function calculateHours(entry: TimeEntryWithRelations): number {
  if (!entry.start || !entry.end) return 0;
  return (entry.end.getTime() - entry.start.getTime()) / 3600000;
}

export async function getEmployeeWeek(
  employee: WeekEmployee,
  weekStartKey: DateKey,
) {
  const week = getWeek(localDateFromKey(weekStartKey));
  const weekStart = new Date(week.startDate);
  const objective =
    employee.weeklyObjectives.find((entry) =>
      isSameUTCDate(entry.weekStart, week.startDate),
    )?.objective ?? DEFAULT_WEEKLY_TARGET;
  const timeEntries = (await getTimeEntries(employee.id, week)) || [];
  const weekly = timeEntries.reduce(
    (sum, entry) => sum + calculateHours(entry),
    0,
  );
  const frozenWeeks = await getFrozenWeeks(employee.id);
  const weekFrozen = !!frozenWeeks?.find((entry) =>
    isSameUTCDate(entry.weekStart, weekStart),
  );

  return { week, weekStart, objective, timeEntries, weekly, weekFrozen };
}
