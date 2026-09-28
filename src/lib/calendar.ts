import {
  CALENDAR_DATE_PARAM,
  CALENDAR_EVENTS_PATH,
  CALENDAR_LOCALE,
  CALENDAR_PATH,
  CALENDAR_TIME_ZONE,
  CALENDAR_WEEK_PARAM,
  DATE_KEY_PATTERN,
  DAYS_PER_WEEK,
  EVENT_COLOR_BG_CLASSES,
  EVENT_PLURAL_LABEL,
  EVENT_SINGULAR_LABEL,
  HOUR_SUFFIX,
  MIDNIGHT_HOUR,
  MIDNIGHT_LABEL,
  NEW_CALENDAR_EVENT_PATH,
  NOON_HOUR,
  NOON_LABEL,
  RECURRENT_CATEGORY,
  WORK_DAYS_PER_WEEK,
  type EventCategory,
} from "@/constants/calendar";
import {
  RecurrenceEnd,
  RecurrenceFrequency,
  type CalendarEventColor,
  type CalendarEventType,
} from "@/generated/prisma/enums";

export type DateKey = string;

export type CalendarEventRecord = {
  id: number;
  type: CalendarEventType;
  title: string;
  detail: string;
  date: DateKey;
  hour: number;
  color: CalendarEventColor;
  frequency: RecurrenceFrequency | null;
  interval: number;
  weekdays: number[];
  endType: RecurrenceEnd;
  endDate: DateKey | null;
  endCount: number | null;
};

export type CalendarOccurrence = {
  key: string;
  eventId: number;
  date: DateKey;
  category: EventCategory;
  title: string;
  detail: string;
  hour: number;
  color: CalendarEventColor;
};

export type CalendarDay = {
  date: DateKey;
  isWeekend: boolean;
  isToday: boolean;
  isMonthStart: boolean;
  occurrences: CalendarOccurrence[];
};

export type CalendarWeek = {
  start: DateKey;
  days: CalendarDay[];
};

export type EventTemplate = Pick<
  CalendarEventRecord,
  "title" | "color" | "type"
>;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MONTHS_PER_YEAR = 12;
const THURSDAY_INDEX = 3;
const ISO_DATE_LENGTH = 10;

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: CALENDAR_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const hourFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: CALENDAR_TIME_ZONE,
  hour: "numeric",
  hourCycle: "h23",
});

const dayLabelFormatter = new Intl.DateTimeFormat(CALENDAR_LOCALE, {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const monthLabelFormatter = new Intl.DateTimeFormat(CALENDAR_LOCALE, {
  timeZone: "UTC",
  month: "long",
  year: "numeric",
});

const shortMonthFormatter = new Intl.DateTimeFormat(CALENDAR_LOCALE, {
  timeZone: "UTC",
  month: "short",
});

function fromDateKey(date: DateKey): Date {
  return new Date(`${date}T00:00:00Z`);
}

export function toDateKey(date: Date): DateKey {
  return date.toISOString().slice(0, ISO_DATE_LENGTH);
}

export function toDbDate(date: DateKey): Date {
  return fromDateKey(date);
}

export function isDateKey(value: unknown): value is DateKey {
  return (
    typeof value === "string" &&
    DATE_KEY_PATTERN.test(value) &&
    !Number.isNaN(fromDateKey(value).getTime()) &&
    toDateKey(fromDateKey(value)) === value
  );
}

export function toLocalDateKey(instant: Date): DateKey {
  return dateKeyFormatter.format(instant);
}

export function toLocalHour(instant: Date): number {
  return Number(hourFormatter.format(instant));
}

export function addDays(date: DateKey, days: number): DateKey {
  return toDateKey(new Date(fromDateKey(date).getTime() + days * MS_PER_DAY));
}

export function daysBetween(from: DateKey, to: DateKey): number {
  return Math.round(
    (fromDateKey(to).getTime() - fromDateKey(from).getTime()) / MS_PER_DAY,
  );
}

export function weekdayOf(date: DateKey): number {
  return fromDateKey(date).getUTCDay();
}

export function mondayOf(date: DateKey): DateKey {
  return addDays(date, -((weekdayOf(date) + 6) % DAYS_PER_WEEK));
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseWeekParam(
  value: string | string[] | undefined,
  today: DateKey,
): DateKey {
  const candidate = firstParam(value);
  return mondayOf(isDateKey(candidate) ? candidate : today);
}

export function parseDateParam(
  value: string | string[] | undefined,
  fallback: DateKey,
): DateKey {
  const candidate = firstParam(value);
  return isDateKey(candidate) ? candidate : fallback;
}

export function calendarWeekPath(weekStart: DateKey): string {
  const params = new URLSearchParams({ [CALENDAR_WEEK_PARAM]: weekStart });
  return `${CALENDAR_PATH}?${params.toString()}`;
}

export function calendarDayPath(date: DateKey): string {
  return `${CALENDAR_PATH}/${date}`;
}

export function newCalendarEventPath(date?: DateKey): string {
  if (!date) {
    return NEW_CALENDAR_EVENT_PATH;
  }
  const params = new URLSearchParams({ [CALENDAR_DATE_PARAM]: date });
  return `${NEW_CALENDAR_EVENT_PATH}?${params.toString()}`;
}

export function calendarEventPath(eventId: number): string {
  return `${CALENDAR_EVENTS_PATH}/${eventId}`;
}

function monthIndex(date: DateKey): number {
  const day = fromDateKey(date);
  return day.getUTCFullYear() * MONTHS_PER_YEAR + day.getUTCMonth();
}

function isSameDayOfMonth(a: DateKey, b: DateKey): boolean {
  return fromDateKey(a).getUTCDate() === fromDateKey(b).getUTCDate();
}

function isSameMonthOfYear(a: DateKey, b: DateKey): boolean {
  return fromDateKey(a).getUTCMonth() === fromDateKey(b).getUTCMonth();
}

function isOnInterval(steps: number, interval: number): boolean {
  return steps >= 0 && steps % interval === 0;
}

export function matchesRecurrence(
  event: Pick<
    CalendarEventRecord,
    "date" | "frequency" | "interval" | "weekdays"
  >,
  date: DateKey,
): boolean {
  const { date: start, interval } = event;
  switch (event.frequency) {
    case RecurrenceFrequency.daily:
      return isOnInterval(daysBetween(start, date), interval);
    case RecurrenceFrequency.weekly:
      return (
        event.weekdays.includes(weekdayOf(date)) &&
        isOnInterval(
          daysBetween(mondayOf(start), mondayOf(date)) / DAYS_PER_WEEK,
          interval,
        )
      );
    case RecurrenceFrequency.monthly:
      return (
        isSameDayOfMonth(start, date) &&
        isOnInterval(monthIndex(date) - monthIndex(start), interval)
      );
    case RecurrenceFrequency.yearly:
      return (
        isSameDayOfMonth(start, date) &&
        isSameMonthOfYear(start, date) &&
        isOnInterval(
          (monthIndex(date) - monthIndex(start)) / MONTHS_PER_YEAR,
          interval,
        )
      );
    default:
      return date === start;
  }
}

export function occurrenceDates(
  event: CalendarEventRecord,
  from: DateKey,
  to: DateKey,
): DateKey[] {
  if (event.frequency === null) {
    return event.date >= from && event.date <= to ? [event.date] : [];
  }
  const countsOccurrences = event.endType === RecurrenceEnd.count;
  const last =
    event.endType === RecurrenceEnd.date && event.endDate && event.endDate < to
      ? event.endDate
      : to;
  const first = countsOccurrences || event.date > from ? event.date : from;
  const dates: DateKey[] = [];
  let seen = 0;
  for (let date = first; date <= last; date = addDays(date, 1)) {
    if (!matchesRecurrence(event, date)) {
      continue;
    }
    seen += 1;
    if (countsOccurrences && seen > (event.endCount ?? 0)) {
      break;
    }
    if (date >= from) {
      dates.push(date);
    }
  }
  return dates;
}

export function eventCategory(
  event: Pick<CalendarEventRecord, "type" | "frequency">,
): EventCategory {
  return event.frequency === null ? event.type : RECURRENT_CATEGORY;
}

export function compareOccurrences(
  a: Pick<CalendarOccurrence, "date" | "hour" | "title">,
  b: Pick<CalendarOccurrence, "date" | "hour" | "title">,
): number {
  return (
    a.date.localeCompare(b.date) ||
    a.hour - b.hour ||
    a.title.localeCompare(b.title, CALENDAR_LOCALE)
  );
}

export function expandOccurrences(
  events: CalendarEventRecord[],
  from: DateKey,
  to: DateKey,
): CalendarOccurrence[] {
  return events
    .flatMap((event) =>
      occurrenceDates(event, from, to).map((date) => ({
        key: `${event.id}-${date}`,
        eventId: event.id,
        date,
        category: eventCategory(event),
        title: event.title,
        detail: event.detail,
        hour: event.hour,
        color: event.color,
      })),
    )
    .toSorted(compareOccurrences);
}

export function buildWeeks(
  start: DateKey,
  weekCount: number,
  today: DateKey,
  occurrences: CalendarOccurrence[],
): CalendarWeek[] {
  const byDate = Map.groupBy(occurrences, ({ date }) => date);
  return Array.from({ length: weekCount }, (_, weekIndex) => {
    const weekStart = addDays(start, weekIndex * DAYS_PER_WEEK);
    return {
      start: weekStart,
      days: Array.from({ length: DAYS_PER_WEEK }, (_, dayIndex) => {
        const date = addDays(weekStart, dayIndex);
        return {
          date,
          isWeekend: dayIndex >= WORK_DAYS_PER_WEEK,
          isToday: date === today,
          isMonthStart: fromDateKey(date).getUTCDate() === 1,
          occurrences: byDate.get(date) ?? [],
        };
      }),
    };
  });
}

export function weekRangeEnd(start: DateKey, weekCount: number): DateKey {
  return addDays(start, weekCount * DAYS_PER_WEEK - 1);
}

export function formatHour(hour: number): string {
  if (hour === MIDNIGHT_HOUR) {
    return MIDNIGHT_LABEL;
  }
  if (hour === NOON_HOUR) {
    return NOON_LABEL;
  }
  return `${hour} ${HOUR_SUFFIX}`;
}

export function occurrenceSubtitle(
  occurrence: Pick<CalendarOccurrence, "detail" | "hour">,
): string {
  return occurrence.detail || formatHour(occurrence.hour);
}

export function occurrenceDescription(
  occurrence: Pick<CalendarOccurrence, "detail" | "hour" | "title">,
): string {
  const detail = occurrence.detail ? ` · ${occurrence.detail}` : "";
  return `${formatHour(occurrence.hour)} — ${occurrence.title}${detail}`;
}

export function eventCountLabel(count: number): string {
  return `${count} ${count > 1 ? EVENT_PLURAL_LABEL : EVENT_SINGULAR_LABEL}`;
}

export function formatDayLabel(date: DateKey): string {
  return dayLabelFormatter.format(fromDateKey(date));
}

export function formatWeekMonthLabel(weekStart: DateKey): string {
  return monthLabelFormatter.format(
    fromDateKey(addDays(weekStart, THURSDAY_INDEX)),
  );
}

export function formatDayNumber(date: DateKey): string {
  const day = fromDateKey(date);
  const dayOfMonth = day.getUTCDate();
  return dayOfMonth === 1
    ? `${dayOfMonth} ${shortMonthFormatter.format(day)}`
    : String(dayOfMonth);
}

export function ordinal(position: number): string {
  return position === 1 ? "1er" : `${position}e`;
}

export function eventColorClass(color: CalendarEventColor): string {
  return EVENT_COLOR_BG_CLASSES[color];
}

export function matchesSearch(
  occurrence: Pick<CalendarOccurrence, "title" | "detail">,
  query: string,
): boolean {
  const needle = query.trim().toLocaleLowerCase(CALENDAR_LOCALE);
  return `${occurrence.title} ${occurrence.detail}`
    .toLocaleLowerCase(CALENDAR_LOCALE)
    .includes(needle);
}

export function isFilterVisible<T>(value: T, active: ReadonlySet<T>): boolean {
  return active.size === 0 || active.has(value);
}

export function toggleFilter<T>(
  active: ReadonlySet<T>,
  value: T,
  all: readonly T[],
): Set<T> {
  const next = new Set(active);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next.size === all.length ? new Set() : next;
}

export function fittingWeekCount(
  availableHeight: number,
  minRowHeight: number,
  maxWeeks: number,
): number {
  return Math.min(
    maxWeeks,
    Math.max(1, Math.floor(availableHeight / minRowHeight)),
  );
}

export type DayOrderPreview<T> = {
  items: (T & { isNew: boolean })[];
  position: number;
};

export function dayOrderPreview<
  T extends Pick<CalendarOccurrence, "date" | "hour" | "title">,
>(existing: T[], draft: T): DayOrderPreview<T> {
  const items = [
    ...existing.map((item) => ({ ...item, isNew: false })),
    { ...draft, isNew: true },
  ].toSorted((a, b) => a.hour - b.hour || (a.isNew ? 1 : b.isNew ? -1 : 0));
  return { items, position: items.findIndex(({ isNew }) => isNew) + 1 };
}

export function parseWeekdays(value: string, separator: string): number[] {
  return [
    ...new Set(
      value
        .split(separator)
        .filter(Boolean)
        .map(Number)
        .filter(
          (day) => Number.isInteger(day) && day >= 0 && day < DAYS_PER_WEEK,
        ),
    ),
  ].toSorted((a, b) => a - b);
}

export function uniqueTemplates(templates: EventTemplate[]): EventTemplate[] {
  return [
    ...new Map(
      templates.map((template) => [template.title, template]),
    ).values(),
  ].toSorted((a, b) => a.title.localeCompare(b.title, CALENDAR_LOCALE));
}

export function isOneOf<T extends string>(
  values: readonly T[],
  value: string,
): value is T {
  return (values as readonly string[]).includes(value);
}
