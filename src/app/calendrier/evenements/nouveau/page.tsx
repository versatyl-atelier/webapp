import {
  NewCalendarEvent,
  type NewCalendarEventPageProps,
} from "@/components/CalendarEventEditor";

export default function Page({ searchParams }: NewCalendarEventPageProps) {
  return (
    <div className="flex flex-col px-6 pt-4">
      <NewCalendarEvent searchParams={searchParams} />
    </div>
  );
}
