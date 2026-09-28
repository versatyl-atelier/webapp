"use client";

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from "react";

import { EVENT_CATEGORIES, type EventCategory } from "@/constants/calendar";
import { toggleFilter } from "@/lib/calendar";

interface CalendarFiltersContextType {
  query: string;
  setQuery: (query: string) => void;
  activeCategories: ReadonlySet<EventCategory>;
  toggleCategory: (category: EventCategory) => void;
}

const CalendarFiltersContext = createContext<CalendarFiltersContextType | null>(
  null,
);

export function CalendarFiltersProvider({ children }: PropsWithChildren) {
  const [query, setQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<
    ReadonlySet<EventCategory>
  >(() => new Set());

  const toggleCategory = useCallback((category: EventCategory) => {
    setActiveCategories((current) =>
      toggleFilter(current, category, EVENT_CATEGORIES),
    );
  }, []);

  return (
    <CalendarFiltersContext.Provider
      value={{ query, setQuery, activeCategories, toggleCategory }}
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
