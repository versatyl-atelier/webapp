"use client";

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from "react";

import {
  CALENDAR_FILTER_KEYS,
  type CalendarFilterKey,
} from "@/constants/calendar";
import { toggleFilter } from "@/lib/calendar";

interface CalendarFiltersContextType {
  query: string;
  setQuery: (query: string) => void;
  activeFilters: ReadonlySet<CalendarFilterKey>;
  toggleFilterKey: (key: CalendarFilterKey) => void;
}

const CalendarFiltersContext = createContext<CalendarFiltersContextType | null>(
  null,
);

export function CalendarFiltersProvider({ children }: PropsWithChildren) {
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<
    ReadonlySet<CalendarFilterKey>
  >(() => new Set());

  const toggleFilterKey = useCallback((key: CalendarFilterKey) => {
    setActiveFilters((current) =>
      toggleFilter(current, key, CALENDAR_FILTER_KEYS),
    );
  }, []);

  return (
    <CalendarFiltersContext.Provider
      value={{ query, setQuery, activeFilters, toggleFilterKey }}
    >
      {children}
    </CalendarFiltersContext.Provider>
  );
}

export function useCalendarFilters() {
  const context = useContext(CalendarFiltersContext);
  if (!context) {
    throw new Error(
      "`useCalendarFilters` must be used within a CalendarFiltersProvider",
    );
  }
  return context;
}
