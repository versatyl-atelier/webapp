import {
  EditCalendarEvent,
  type CalendarEventPageProps,
} from "@/components/CalendarEventEditor";

export default function ModalEditEvent({ params }: CalendarEventPageProps) {
  return <EditCalendarEvent params={params} isModal />;
}
