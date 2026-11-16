import Link from "next/link";

import { getHomeEventOccurrences } from "@/actions/calendar";
import { ActionTooltip } from "@/components/ActionTooltip";
import { EventCategoryIcon } from "@/components/EventCategoryIcon";
import { HomeWidgetCard } from "@/components/HomeWidgetCard";
import { CardContent } from "@/components/ui/card";
import {
  EMPTY_TODAY_LABEL,
  HOME_SIDE_WIDGET_HEIGHT_CLASS,
  HOME_WIDGETS,
  TOMORROW_LABEL,
} from "@/constants/home";
import {
  addDays,
  calendarDayPath,
  formatHour,
  occurrenceColorClass,
  occurrenceDescription,
  type DateKey,
} from "@/lib/calendar";
import { homeWidgetLink, todayWidgetTitle } from "@/lib/home";
import { occurrenceColorStyle } from "@/lib/projects";
import { cn } from "@/lib/utils";

const ROW_CLASS = "flex items-center gap-2.5 px-3 py-2 text-sm";

type TodayEventsProps = {
  today: DateKey;
  interactive: boolean;
};

export async function TodayEvents({ today, interactive }: TodayEventsProps) {
  const occurrences = await getHomeEventOccurrences(today, addDays(today, 1));

  return (
    <HomeWidgetCard
      widget={HOME_WIDGETS.today}
      title={todayWidgetTitle(today)}
      link={homeWidgetLink(HOME_WIDGETS.today, interactive)}
    >
      {occurrences.length === 0 ? (
        <CardContent className="py-3">
          <p
            className={cn(
              "text-muted-foreground flex items-center text-sm",
              HOME_SIDE_WIDGET_HEIGHT_CLASS,
            )}
          >
            {EMPTY_TODAY_LABEL}
          </p>
        </CardContent>
      ) : (
        <ul className={cn("overflow-y-auto", HOME_SIDE_WIDGET_HEIGHT_CLASS)}>
          {occurrences.map((occurrence) => {
            const isToday = occurrence.date === today;
            const rowClass = cn(ROW_CLASS, !isToday && "opacity-65");
            return (
              <li key={occurrence.key} className="border-b last:border-b-0">
                <ActionTooltip
                  label={occurrenceDescription(occurrence)}
                  render={
                    interactive ? (
                      <Link
                        href={calendarDayPath(occurrence.date)}
                        className={cn(
                          rowClass,
                          "hover:bg-accent focus-visible:ring-ring transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset",
                        )}
                      />
                    ) : (
                      <div className={rowClass} />
                    )
                  }
                >
                  <span
                    className={cn(
                      "w-11 shrink-0 text-xs tabular-nums",
                      isToday ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {isToday ? formatHour(occurrence.hour) : TOMORROW_LABEL}
                  </span>
                  <span
                    style={occurrenceColorStyle(occurrence)}
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-sm",
                      occurrenceColorClass(occurrence),
                    )}
                  >
                    <EventCategoryIcon
                      category={occurrence.category}
                      className="text-2xs"
                    />
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {occurrence.title}
                  </span>
                </ActionTooltip>
              </li>
            );
          })}
        </ul>
      )}
    </HomeWidgetCard>
  );
}
