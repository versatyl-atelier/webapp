import { notFound } from "next/navigation";

import { CalendarDayDetail } from "@/components/CalendarDayDetail";
import { calendarDayPath, isDateKey } from "@/lib/calendar";
import { requireActiveSession } from "@/lib/session";

export type CalendarDayPageProps = {
  params: Promise<{ date: string }>;
};

export default async function DayPage({ params }: CalendarDayPageProps) {
  const { date } = await params;
  if (!isDateKey(date)) {
    notFound();
  }
  await requireActiveSession(calendarDayPath(date));

  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <CalendarDayDetail date={date} />
    </div>
  );
}
