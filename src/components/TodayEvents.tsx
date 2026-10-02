import Link from "next/link";

import { getProjectOccurrences } from "@/actions/calendar";
import { EventCategoryIcon } from "@/components/EventCategoryIcon";
import { HomeCardLink } from "@/components/HomeCardLink";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CALENDAR_PATH } from "@/constants/calendar";
import {
  CALENDAR_LINK_LABEL,
  EMPTY_TODAY_LABEL,
  TODAY_EVENTS_LIST_HEIGHT_CLASS,
  TODAY_HEADING,
  TOMORROW_LABEL,
} from "@/constants/home";
import {
  addDays,
  calendarDayPath,
  eventColorClass,
  formatDayMonth,
  formatHour,
  occurrenceDescription,
  type DateKey,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";

type TodayEventsProps = {
  today: DateKey;
};

export async function TodayEvents({ today }: TodayEventsProps) {
  const occurrences = await getProjectOccurrences(today, addDays(today, 1));

  return (
    <Card size="sm" className="gap-0 py-0">
      <CardHeader className="bg-muted/50 border-b py-2.5">
        <CardTitle className="font-semibold">
          {TODAY_HEADING} — {formatDayMonth(today)}
        </CardTitle>
        <CardAction>
          <HomeCardLink href={CALENDAR_PATH}>
            {CALENDAR_LINK_LABEL}
          </HomeCardLink>
        </CardAction>
      </CardHeader>
      {occurrences.length === 0 ? (
        <CardContent className="py-3">
          <p
            className={cn(
              "text-muted-foreground flex items-center text-sm",
              TODAY_EVENTS_LIST_HEIGHT_CLASS,
            )}
          >
            {EMPTY_TODAY_LABEL}
          </p>
        </CardContent>
      ) : (
        <ul className={cn("overflow-y-auto", TODAY_EVENTS_LIST_HEIGHT_CLASS)}>
          {occurrences.map((occurrence) => {
            const isToday = occurrence.date === today;
            return (
              <li key={occurrence.key} className="border-b last:border-b-0">
                <Link
                  href={calendarDayPath(occurrence.date)}
                  title={occurrenceDescription(occurrence)}
                  className={cn(
                    "hover:bg-accent focus-visible:ring-ring flex items-center gap-2.5 px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset",
                    !isToday && "opacity-65",
                  )}
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
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-sm text-white",
                      eventColorClass(occurrence.color),
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
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
