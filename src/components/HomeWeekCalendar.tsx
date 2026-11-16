import { getHomeCalendarOccurrences } from "@/actions/calendar";
import { CalendarCategoryFilters } from "@/components/CalendarCategoryFilters";
import { CalendarView } from "@/components/CalendarView";
import { HomeWidgetCard } from "@/components/HomeWidgetCard";
import { HOME_WEEK_HEIGHT_CLASS, HOME_WIDGETS } from "@/constants/home";
import { CalendarFiltersProvider } from "@/contexts/calendar-filters-provider";
import {
  buildWeeks,
  mondayOf,
  weekRangeEnd,
  type DateKey,
} from "@/lib/calendar";
import { homeWidgetLink, weekWidgetTitle } from "@/lib/home";
import { cn } from "@/lib/utils";

const WEEK_COUNT = 1;

type HomeWeekCalendarProps = {
  today: DateKey;
  canEdit: boolean;
  interactive: boolean;
};

export async function HomeWeekCalendar({
  today,
  canEdit,
  interactive,
}: HomeWeekCalendarProps) {
  const weekStart = mondayOf(today);
  const occurrences = await getHomeCalendarOccurrences(
    weekStart,
    weekRangeEnd(weekStart, WEEK_COUNT),
  );

  return (
    <CalendarFiltersProvider>
      <HomeWidgetCard
        widget={HOME_WIDGETS.week}
        title={weekWidgetTitle(today)}
        link={homeWidgetLink(HOME_WIDGETS.week, interactive)}
        toolbar={<CalendarCategoryFilters />}
      >
        <div className={cn("flex flex-col", HOME_WEEK_HEIGHT_CLASS)}>
          <CalendarView
            weeks={buildWeeks(weekStart, WEEK_COUNT, today, occurrences)}
            canEdit={canEdit}
            interactive={interactive}
          />
        </div>
      </HomeWidgetCard>
    </CalendarFiltersProvider>
  );
}
