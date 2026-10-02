import { getCalendarOccurrences, getEventTemplates } from "@/actions/calendar";
import { getAllProjects } from "@/actions/projects";
import { CalendarEventForm } from "@/components/CalendarEventForm";
import { CALENDAR_DATE_PARAM, NEW_EVENT_LABEL } from "@/constants/calendar";
import {
  calendarWeekPath,
  linkableProjects,
  mondayOf,
  newCalendarEventPath,
  parseDateParam,
  toLocalDateKey,
} from "@/lib/calendar";
import { requireActiveSession } from "@/lib/session";

type NewCalendarEventPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({
  searchParams,
}: NewCalendarEventPageProps) {
  const date = parseDateParam(
    (await searchParams)[CALENDAR_DATE_PARAM],
    toLocalDateKey(new Date()),
  );
  await requireActiveSession(newCalendarEventPath(date));
  const [templates, dayOccurrences, projects] = await Promise.all([
    getEventTemplates(),
    getCalendarOccurrences(date, date),
    getAllProjects(),
  ]);

  return (
    <div className="flex flex-col gap-6 px-6 pt-4 pb-16">
      <h1 className="text-base font-semibold tracking-tight">
        {NEW_EVENT_LABEL}
      </h1>
      <CalendarEventForm
        initialDate={date}
        initialDayOccurrences={dayOccurrences}
        templates={templates}
        projects={linkableProjects(projects, null)}
        cancelHref={calendarWeekPath(mondayOf(date))}
      />
    </div>
  );
}
