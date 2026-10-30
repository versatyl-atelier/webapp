import { getTimesheet } from "@/actions/timesheet";
import { TimesheetTable } from "@/components/TimesheetTable";
import { PUNCH_TIMESHEET_PATH } from "@/constants/punch";
import { toLocalDateKey } from "@/lib/calendar";
import { requireActiveSession } from "@/lib/session";
import { periodWeekStarts, resolveTimesheetParams } from "@/lib/timesheet";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: PageProps) {
  await requireActiveSession(PUNCH_TIMESHEET_PATH);
  const today = toLocalDateKey(new Date());
  const { period, payEnd } = resolveTimesheetParams(await searchParams, today);
  const weekStarts = periodWeekStarts(period, today, payEnd);
  const rows = await getTimesheet(weekStarts[0], weekStarts.length);

  return (
    <div className="flex min-w-0 flex-col gap-4 p-4">
      <TimesheetTable weekStarts={weekStarts} rows={rows} />
    </div>
  );
}
