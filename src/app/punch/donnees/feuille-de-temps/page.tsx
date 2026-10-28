import { getTimesheet } from "@/actions/timesheet";
import { PeriodPicker } from "@/components/PeriodPicker";
import { TimesheetTable } from "@/components/TimesheetTable";
import { PUNCH_TIMESHEET_PATH } from "@/constants/punch";
import { PAY_END_PARAM, PERIOD_PARAM } from "@/constants/timesheet";
import { parseDateParam, toLocalDateKey } from "@/lib/calendar";
import { requireActiveSession } from "@/lib/session";
import { parsePeriod, payPeriodEnds, periodWeekStarts } from "@/lib/timesheet";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: PageProps) {
  await requireActiveSession(PUNCH_TIMESHEET_PATH);
  const params = await searchParams;
  const today = toLocalDateKey(new Date());
  const period = parsePeriod(params[PERIOD_PARAM]);
  const payEnds = payPeriodEnds(today);
  const payEnd = parseDateParam(params[PAY_END_PARAM], payEnds[0]);
  const weekStarts = periodWeekStarts(period, today, payEnd);
  const rows = await getTimesheet(weekStarts[0], weekStarts.length);

  return (
    <div className="flex min-w-0 flex-col gap-4 p-4">
      <PeriodPicker period={period} payEnd={payEnd} payEnds={payEnds} />
      <TimesheetTable weekStarts={weekStarts} rows={rows} />
    </div>
  );
}
