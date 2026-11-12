import { notFound } from "next/navigation";

import { getCalendarEvent } from "@/actions/calendar";
import { getAllProjects } from "@/actions/projects";
import { CalendarEventForm } from "@/components/CalendarEventForm";
import { CALENDAR_DATE_PARAM } from "@/constants/calendar";
import {
  calendarEventPath,
  calendarWeekPath,
  linkableProjects,
  mondayOf,
  newCalendarEventPath,
  parseDateParam,
  toLocalDateKey,
  type CalendarEventRecord,
  type DateKey,
} from "@/lib/calendar";
import { requireActiveSession } from "@/lib/session";

export type NewCalendarEventPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export type CalendarEventPageProps = {
  params: Promise<{ id: string }>;
};

type EditorProps = { isModal?: boolean };

async function CalendarEventEditor({
  event,
  date,
  isModal = false,
}: EditorProps & { event?: CalendarEventRecord; date: DateKey }) {
  const projects = await getAllProjects();

  return (
    <CalendarEventForm
      key={event?.id ?? date}
      event={event}
      initialDate={date}
      projects={linkableProjects(projects, event?.projectId ?? null)}
      cancelHref={calendarWeekPath(mondayOf(date))}
      isModal={isModal}
    />
  );
}

export async function NewCalendarEvent({
  searchParams,
  isModal,
}: NewCalendarEventPageProps & EditorProps) {
  const date = parseDateParam(
    (await searchParams)[CALENDAR_DATE_PARAM],
    toLocalDateKey(new Date()),
  );
  await requireActiveSession(newCalendarEventPath(date));

  return <CalendarEventEditor date={date} isModal={isModal} />;
}

export async function EditCalendarEvent({
  params,
  isModal,
}: CalendarEventPageProps & EditorProps) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    notFound();
  }
  await requireActiveSession(calendarEventPath(id));
  const event = await getCalendarEvent(id);
  if (!event) {
    notFound();
  }

  return (
    <CalendarEventEditor event={event} date={event.date} isModal={isModal} />
  );
}
