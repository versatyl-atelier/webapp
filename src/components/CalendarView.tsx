"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

import { CalendarEventChip } from "@/components/CalendarEventChip";
import { EventCategoryIcon } from "@/components/EventCategoryIcon";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  CALENDAR_COLUMNS_CLASS,
  CATEGORY_FILTER_LABEL,
  DAYS_PER_WEEK,
  DEFAULT_VISIBLE_WEEKS,
  EVENT_CATEGORIES,
  EVENT_CATEGORY_LABELS,
  MIN_WEEK_ROW_HEIGHT_PX,
  NEW_EVENT_LABEL,
  NEXT_WEEK_LABEL,
  PREVIOUS_WEEK_LABEL,
  SEARCH_LABEL,
  SEARCH_PLACEHOLDER,
  TODAY_LABEL,
  WEEK_NAV_LABEL,
  WEEKDAY_LABELS,
  WORK_DAYS_PER_WEEK,
  type EventCategory,
} from "@/constants/calendar";
import {
  addDays,
  calendarDayPath,
  calendarWeekPath,
  eventCountLabel,
  fittingWeekCount,
  formatDayLabel,
  formatDayNumber,
  formatWeekMonthLabel,
  isFilterVisible,
  matchesSearch,
  newCalendarEventPath,
  toggleFilter,
  type CalendarDay,
  type CalendarWeek,
  type DateKey,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";

type CalendarViewProps = {
  weeks: CalendarWeek[];
  todayWeekStart: DateKey;
  canEdit: boolean;
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

export function CalendarView({
  weeks,
  todayWeekStart,
  canEdit,
}: CalendarViewProps) {
  const [query, setQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<
    ReadonlySet<EventCategory>
  >(() => new Set());
  const { containerRef, weekCount } = useFittingWeekCount(weeks.length);
  const visibleWeeks = weeks.slice(0, weekCount);
  const firstWeekStart = weeks[0].start;

  return (
    <div className="bg-background flex min-h-0 flex-1 flex-col">
      <div className="bg-card flex shrink-0 flex-wrap items-center gap-3.5 border-b px-6 py-3">
        <nav className="flex items-center gap-1" aria-label={WEEK_NAV_LABEL}>
          <Button asChild variant="outline" size="icon-sm">
            <Link
              href={calendarWeekPath(addDays(firstWeekStart, -DAYS_PER_WEEK))}
              aria-label={PREVIOUS_WEEK_LABEL}
              title={PREVIOUS_WEEK_LABEL}
            >
              <ChevronLeft />
            </Link>
          </Button>
          <Button asChild variant="outline" size="icon-sm">
            <Link
              href={calendarWeekPath(addDays(firstWeekStart, DAYS_PER_WEEK))}
              aria-label={NEXT_WEEK_LABEL}
              title={NEXT_WEEK_LABEL}
            >
              <ChevronRight />
            </Link>
          </Button>
        </nav>
        <h1 className="min-w-36 text-base font-semibold tracking-tight capitalize">
          {formatWeekMonthLabel(firstWeekStart)}
        </h1>
        <Button asChild variant="outline" size="sm">
          <Link href={calendarWeekPath(todayWeekStart)}>{TODAY_LABEL}</Link>
        </Button>
        <InputGroup className="bg-muted h-8 max-w-60 min-w-44">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            aria-label={SEARCH_LABEL}
            placeholder={SEARCH_PLACEHOLDER}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </InputGroup>
        <div
          role="group"
          aria-label={CATEGORY_FILTER_LABEL}
          className="ml-auto flex flex-wrap items-center gap-1"
        >
          {EVENT_CATEGORIES.map((category) => (
            <Button
              key={category}
              type="button"
              variant="ghost"
              size="xs"
              aria-pressed={activeCategories.has(category)}
              onClick={() =>
                setActiveCategories((current) =>
                  toggleFilter(current, category, EVENT_CATEGORIES),
                )
              }
              className="text-muted-foreground aria-pressed:border-punch-accent aria-pressed:bg-punch-accent/10 aria-pressed:text-punch-accent"
            >
              <EventCategoryIcon category={category} />
              {EVENT_CATEGORY_LABELS[category]}
            </Button>
          ))}
        </div>
        {canEdit && (
          <Button asChild size="sm">
            <Link href={newCalendarEventPath()}>
              <Plus />
              {NEW_EVENT_LABEL}
            </Link>
          </Button>
        )}
      </div>

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
              ? "bg-punch-accent font-semibold text-white"
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
