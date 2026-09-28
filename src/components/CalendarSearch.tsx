"use client";

import { Search } from "lucide-react";
import { useId } from "react";

import { Label } from "@/components/ui/label";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarInput,
} from "@/components/ui/sidebar";
import { SEARCH_LABEL, SEARCH_PLACEHOLDER } from "@/constants/calendar";
import { useCalendarFilters } from "@/contexts/calendar-filters-provider";

export function CalendarSearch() {
  const inputId = useId();
  const { query, setQuery } = useCalendarFilters();

  return (
    <form role="search" onSubmit={(event) => event.preventDefault()}>
      <SidebarGroup className="shrink-0">
        <SidebarGroupContent className="relative">
          <Label htmlFor={inputId} className="sr-only">
            {SEARCH_LABEL}
          </Label>
          <SidebarInput
            id={inputId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={SEARCH_PLACEHOLDER}
            className="pl-8"
          />
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none"
          />
        </SidebarGroupContent>
      </SidebarGroup>
    </form>
  );
}
