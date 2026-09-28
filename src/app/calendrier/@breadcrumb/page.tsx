import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { CalendarWeekCrumbs } from "@/components/CalendarWeekCrumbs";
import { CALENDAR_WEEK_PARAM } from "@/constants/calendar";
import { mondayOf, parseWeekParam, toLocalDateKey } from "@/lib/calendar";

type CalendrierBreadcrumbProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CalendrierBreadcrumb({
  searchParams,
}: CalendrierBreadcrumbProps) {
  const today = toLocalDateKey(new Date());
  const weekStart = parseWeekParam(
    (await searchParams)[CALENDAR_WEEK_PARAM],
    today,
  );

  return (
    <AppBreadcrumb segments={["calendrier"]}>
      <CalendarWeekCrumbs
        weekStart={weekStart}
        todayWeekStart={mondayOf(today)}
      />
    </AppBreadcrumb>
  );
}
