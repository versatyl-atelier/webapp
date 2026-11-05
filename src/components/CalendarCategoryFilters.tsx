"use client";

import { ChevronDown } from "lucide-react";

import { EventCategoryIcon } from "@/components/EventCategoryIcon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CATEGORY_FILTER_LABEL,
  EVENT_CATEGORIES,
  EVENT_CATEGORY_LABELS,
  LANCEUR_CATEGORY,
  LANCEUR_FILTER_KEYS,
} from "@/constants/calendar";
import {
  LANCEUR_DATE_KINDS,
  LANCEUR_DATE_KIND_LABELS,
  LANCEUR_FILTER_MENU_LABEL,
} from "@/constants/lanceurCalendar";
import { useCalendarFilters } from "@/contexts/calendar-filters-provider";
import { cn } from "@/lib/utils";

const FILTER_BUTTON_CLASS =
  "text-muted-foreground aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary";

type CalendarCategoryFiltersProps = {
  className?: string;
};

export function CalendarCategoryFilters({
  className,
}: CalendarCategoryFiltersProps) {
  const { activeFilters, toggleFilterKey } = useCalendarFilters();

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
          aria-pressed={activeFilters.has(category)}
          onClick={() => toggleFilterKey(category)}
          className={FILTER_BUTTON_CLASS}
        >
          <EventCategoryIcon category={category} />
          {EVENT_CATEGORY_LABELS[category]}
        </Button>
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="xs"
              aria-pressed={LANCEUR_DATE_KINDS.some((kind) =>
                activeFilters.has(LANCEUR_FILTER_KEYS[kind]),
              )}
              className={FILTER_BUTTON_CLASS}
            />
          }
        >
          <EventCategoryIcon category={LANCEUR_CATEGORY} />
          {EVENT_CATEGORY_LABELS[LANCEUR_CATEGORY]}
          <ChevronDown aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          aria-label={LANCEUR_FILTER_MENU_LABEL}
          className="w-auto"
        >
          {LANCEUR_DATE_KINDS.map((kind) => (
            <DropdownMenuCheckboxItem
              key={kind}
              checked={activeFilters.has(LANCEUR_FILTER_KEYS[kind])}
              onCheckedChange={() => toggleFilterKey(LANCEUR_FILTER_KEYS[kind])}
            >
              {LANCEUR_DATE_KIND_LABELS[kind]}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
