import {
  NewCalendarEvent,
  type NewCalendarEventPageProps,
} from "@/components/CalendarEventEditor";

export default function ModalNewEvent({
  searchParams,
}: NewCalendarEventPageProps) {
  return <NewCalendarEvent searchParams={searchParams} isModal />;
}
