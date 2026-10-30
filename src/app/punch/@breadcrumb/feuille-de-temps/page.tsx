import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { PeriodCrumbs } from "@/components/PeriodCrumbs";
import { toLocalDateKey } from "@/lib/calendar";
import { resolveTimesheetParams } from "@/lib/timesheet";

type TimesheetBreadcrumbProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function TimesheetBreadcrumb({
  searchParams,
}: TimesheetBreadcrumbProps) {
  const { period, payEnds, payEnd } = resolveTimesheetParams(
    await searchParams,
    toLocalDateKey(new Date()),
  );

  return (
    <AppBreadcrumb segments={["punch", "feuille-de-temps"]}>
      <PeriodCrumbs period={period} payEnd={payEnd} payEnds={payEnds} />
    </AppBreadcrumb>
  );
}
