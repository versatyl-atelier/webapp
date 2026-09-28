import { getCalendarOccurrences } from "@/actions/calendar";
import { CalendarView } from "@/components/CalendarView";
import {
  CALENDAR_PATH,
  CALENDAR_WEEK_PARAM,
  MAX_VISIBLE_WEEKS,
} from "@/constants/calendar";
import { Role } from "@/generated/prisma/enums";
import {
  buildWeeks,
  mondayOf,
  parseWeekParam,
  toLocalDateKey,
  weekRangeEnd,
} from "@/lib/calendar";
import { hasRole } from "@/lib/permissions";
import { requireActiveSession } from "@/lib/session";

type CalendarPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: CalendarPageProps) {
  const session = await requireActiveSession(CALENDAR_PATH);
  const today = toLocalDateKey(new Date());
  const weekStart = parseWeekParam(
    (await searchParams)[CALENDAR_WEEK_PARAM],
    today,
  );
  const occurrences = await getCalendarOccurrences(
    weekStart,
    weekRangeEnd(weekStart, MAX_VISIBLE_WEEKS),
  );

  return (
    <CalendarView
      weeks={buildWeeks(weekStart, MAX_VISIBLE_WEEKS, today, occurrences)}
      todayWeekStart={mondayOf(today)}
      canEdit={hasRole(session.role, Role.manager)}
    />
  );
}
