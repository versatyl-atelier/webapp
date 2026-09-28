import { notFound } from "next/navigation";

import { type CalendarDayPageProps } from "@/app/calendrier/[date]/page";
import { CalendarDayDetail } from "@/components/CalendarDayDetail";
import { Modal } from "@/components/Modal";
import { calendarDayPath, isDateKey } from "@/lib/calendar";

export default async function ModalDay({ params }: CalendarDayPageProps) {
  const { date } = await params;
  if (!isDateKey(date)) {
    notFound();
  }

  return (
    <Modal
      path={calendarDayPath(date)}
      className="data-open:zoom-in-75 data-closed:zoom-out-75 flex max-h-[86svh] flex-col p-5 duration-200 sm:max-w-2xl"
    >
      <CalendarDayDetail date={date} isModal />
    </Modal>
  );
}
