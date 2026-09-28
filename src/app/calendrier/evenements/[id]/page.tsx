import { notFound } from "next/navigation";

import {
  getCalendarEvent,
  getCalendarOccurrences,
  getEventTemplates,
} from "@/actions/calendar";
import { CalendarEventForm } from "@/components/CalendarEventForm";
import { EDIT_EVENT_LABEL } from "@/constants/calendar";
import { calendarEventPath, calendarWeekPath, mondayOf } from "@/lib/calendar";
import { requireActiveSession } from "@/lib/session";

type CalendarEventPageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: CalendarEventPageProps) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    notFound();
  }
  await requireActiveSession(calendarEventPath(id));
  const event = await getCalendarEvent(id);
  if (!event) {
    notFound();
  }
  const [templates, dayOccurrences] = await Promise.all([
    getEventTemplates(),
    getCalendarOccurrences(event.date, event.date),
  ]);

  return (
    <div className="flex flex-col gap-6 px-6 pt-4 pb-16">
      <h1 className="text-base font-semibold tracking-tight">
        {EDIT_EVENT_LABEL}
      </h1>
      <CalendarEventForm
        event={event}
        initialDate={event.date}
        initialDayOccurrences={dayOccurrences}
        templates={templates}
        cancelHref={calendarWeekPath(mondayOf(event.date))}
      />
    </div>
  );
}
