import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { CalendarCategoryFilters } from "@/components/CalendarCategoryFilters";
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
    <div className="flex min-w-0 flex-1 flex-col gap-1 py-1 pr-2 md:flex-row md:items-center">
      <AppBreadcrumb segments={["calendrier"]}>
        <CalendarWeekCrumbs
          weekStart={weekStart}
          todayWeekStart={mondayOf(today)}
        />
      </AppBreadcrumb>
      <CalendarCategoryFilters className="md:ml-auto" />
    </div>
  );
}
