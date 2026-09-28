"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { CalendarEventChip } from "@/components/CalendarEventChip";
import {
  CALENDAR_COLUMNS_CLASS,
  DEFAULT_VISIBLE_WEEKS,
  MIN_WEEK_ROW_HEIGHT_PX,
  WEEKDAY_LABELS,
  WORK_DAYS_PER_WEEK,
  type EventCategory,
} from "@/constants/calendar";
import { useCalendarFilters } from "@/contexts/calendar-filters-provider";
import {
  calendarDayPath,
  eventCountLabel,
  fittingWeekCount,
  formatDayLabel,
  formatDayNumber,
  isFilterVisible,
  matchesSearch,
  type CalendarDay,
  type CalendarWeek,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";

type CalendarViewProps = {
  weeks: CalendarWeek[];
};

function useFittingWeekCount(maxWeeks: number) {
  const containerRef = useRef<HTMLOListElement>(null);
  const [weekCount, setWeekCount] = useState(DEFAULT_VISIBLE_WEEKS);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      setWeekCount(
        fittingWeekCount(
          entry.contentRect.height,
          MIN_WEEK_ROW_HEIGHT_PX,
          maxWeeks,
        ),
      );
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [maxWeeks]);

  return { containerRef, weekCount };
}

export function CalendarView({ weeks }: CalendarViewProps) {
  const { query, activeCategories } = useCalendarFilters();
  const { containerRef, weekCount } = useFittingWeekCount(weeks.length);
  const visibleWeeks = weeks.slice(0, weekCount);

  return (
    <div className="bg-background flex min-h-0 flex-1 flex-col">
      <div
        aria-hidden
        className={cn(
          "bg-muted text-muted-foreground text-2xs grid shrink-0 border-b font-semibold tracking-wide uppercase",
          CALENDAR_COLUMNS_CLASS,
        )}
      >
        {WEEKDAY_LABELS.map((label, index) => (
          <span
            key={label}
            className={cn(
              "px-2 pt-1.5 pb-1",
              index < WORK_DAYS_PER_WEEK ? "text-right" : "text-center",
            )}
          >
            {label}
          </span>
        ))}
      </div>

      <ol ref={containerRef} className="flex min-h-0 flex-1 flex-col">
        {visibleWeeks.map((week) => (
          <li key={week.start} className="flex min-h-0 flex-1">
            <ol
              className={cn(
                "grid w-full grid-rows-[minmax(0,1fr)]",
                CALENDAR_COLUMNS_CLASS,
              )}
            >
              {week.days.map((day) => (
                <CalendarDayCell
                  key={day.date}
                  day={day}
                  query={query}
                  activeCategories={activeCategories}
                />
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </div>
  );
}

type CalendarDayCellProps = {
  day: CalendarDay;
  query: string;
  activeCategories: ReadonlySet<EventCategory>;
};

function CalendarDayCell({
  day,
  query,
  activeCategories,
}: CalendarDayCellProps) {
  const occurrences = day.occurrences.filter(({ category }) =>
    isFilterVisible(category, activeCategories),
  );
  const hasQuery = query.trim().length > 0;

  return (
    <li className="min-h-0 min-w-0 border-r border-b last:border-r-0">
      <Link
        href={calendarDayPath(day.date)}
        scroll={false}
        aria-label={`${formatDayLabel(day.date)}, ${eventCountLabel(occurrences.length)}`}
        aria-current={day.isToday ? "date" : undefined}
        className={cn(
          "hover:bg-muted focus-visible:ring-ring flex h-full flex-col gap-1 overflow-hidden p-1.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset",
          day.isWeekend ? "bg-muted/60 items-center px-0.5" : "bg-card",
          day.isMonthStart && "border-l-foreground border-l-3",
        )}
      >
        <span
          className={cn(
            "flex h-5 min-w-5 shrink-0 items-center justify-center self-end rounded-full px-1.5 text-xs font-medium whitespace-nowrap tabular-nums",
            day.isWeekend && "text-2xs self-center",
            day.isToday
              ? "bg-primary text-primary-foreground font-semibold"
              : "text-muted-foreground",
          )}
        >
          {formatDayNumber(day.date)}
        </span>
        <ul
          className={cn(
            "flex min-h-0 w-full flex-1 scrollbar-thin flex-col gap-1 overflow-x-hidden overflow-y-auto",
            day.isWeekend && "items-center",
          )}
        >
          {occurrences.map((occurrence) => (
            <CalendarEventChip
              key={occurrence.key}
              occurrence={occurrence}
              compact={day.isWeekend}
              highlight={
                hasQuery
                  ? matchesSearch(occurrence, query)
                    ? "match"
                    : "dim"
                  : "none"
              }
            />
          ))}
        </ul>
      </Link>
    </li>
  );
}
