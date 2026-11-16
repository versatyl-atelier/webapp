import {
  EditCalendarEvent,
  type CalendarEventPageProps,
} from "@/components/CalendarEventEditor";

export default function Page({ params }: CalendarEventPageProps) {
  return (
    <div className="flex flex-col px-6 pt-4">
      <EditCalendarEvent params={params} />
    </div>
  );
}
