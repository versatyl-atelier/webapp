"use client";

import { EventCategoryIcon } from "@/components/EventCategoryIcon";
import { Button } from "@/components/ui/button";
import {
  CATEGORY_FILTER_LABEL,
  EVENT_CATEGORIES,
  EVENT_CATEGORY_LABELS,
} from "@/constants/calendar";
import { useCalendarFilters } from "@/contexts/calendar-filters-provider";
import { cn } from "@/lib/utils";

type CalendarCategoryFiltersProps = {
  className?: string;
};

export function CalendarCategoryFilters({
  className,
}: CalendarCategoryFiltersProps) {
  const { activeCategories, toggleCategory } = useCalendarFilters();

  return (
    <div
      role="group"
      aria-label={CATEGORY_FILTER_LABEL}
      className={cn("flex flex-wrap items-center gap-1", className)}
    >
      {EVENT_CATEGORIES.map((category) => (
        <Button
          key={category}
          type="button"
          variant="ghost"
          size="xs"
          aria-pressed={activeCategories.has(category)}
          onClick={() => toggleCategory(category)}
          className="text-muted-foreground aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary"
        >
          <EventCategoryIcon category={category} />
          {EVENT_CATEGORY_LABELS[category]}
        </Button>
      ))}
    </div>
  );
}
