import {
  ACTIVITY_DETAIL_SEPARATOR,
  ACTIVITY_EDIT_GRACE_MS,
  ACTIVITY_GROUP_WINDOW_MS,
  ACTIVITY_GROUPABLE_KINDS,
  ACTIVITY_KILOMETRAGE_UNIT,
  ACTIVITY_KINDS,
  ACTIVITY_NAME_SEPARATOR,
  ACTIVITY_OUT_OF_LABEL,
  ACTIVITY_UNKNOWN_SUBJECT_LABEL,
  PUNCH_ENTRY_METHOD,
  type ActivityKind,
} from "@/constants/activity";
import { CALENDAR_LOCALE, CALENDAR_TIME_ZONE } from "@/constants/calendar";
import { COPY_ENTRY_METHOD } from "@/constants/timeEntries";
import type { FrozenWeek, WeeklyObjective } from "@/generated/prisma/client";
import { toDbDate, toLocalDateKey, type DateKey } from "@/lib/calendar";
import { formatTimeDisplay } from "@/lib/time";

const MS_PER_HOUR = 60 * 60 * 1000;

export type ActivityEvent = {
  id: string;
  kind: ActivityKind;
  at: Date;
  names: string[];
  hours: number | null;
  note: string | null;
};

export type ActivityEntry = {
  id: number;
  start: Date;
  end: Date | null;
  entryMethod: string;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  projects: {
    project: { name: string } | null;
    task: { name: string } | null;
  }[];
};

export type ActivityFrozenWeek = Pick<
  FrozenWeek,
  "weekTotal" | "objective" | "isDeleted" | "createdAt" | "updatedAt"
>;

export type ActivityObjective = Pick<
  WeeklyObjective,
  "objective" | "updatedAt"
>;

export type ActivitySource = {
  entries: readonly ActivityEntry[];
  frozenWeek: ActivityFrozenWeek | null;
  objective: ActivityObjective | null;
  kilometrage: number;
};

export type ActivityDay = {
  dayKey: DateKey;
  events: ActivityEvent[];
};

const timeFormatter = new Intl.DateTimeFormat(CALENDAR_LOCALE, {
  timeZone: CALENDAR_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

const dayHeadingFormatter = new Intl.DateTimeFormat(CALENDAR_LOCALE, {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
});

function subjectNames(entry: ActivityEntry): string[] {
  return entry.projects.map(
    ({ project, task }) =>
      project?.name ?? task?.name ?? ACTIVITY_UNKNOWN_SUBJECT_LABEL,
  );
}

function entryHours(entry: ActivityEntry): number | null {
  return entry.end
    ? (entry.end.getTime() - entry.start.getTime()) / MS_PER_HOUR
    : null;
}

function entryEvent(
  entry: ActivityEntry,
  kind: ActivityKind,
  at: Date,
  withHours: boolean,
): ActivityEvent {
  return {
    id: `${kind}-${entry.id}`,
    kind,
    at,
    names: subjectNames(entry),
    hours: withHours ? entryHours(entry) : null,
    note: null,
  };
}

function weekEvent(
  kind: ActivityKind,
  at: Date,
  note: string | null,
): ActivityEvent {
  return { id: kind, kind, at, names: [], hours: null, note };
}

function entryEvents(entry: ActivityEntry): ActivityEvent[] {
  const isPunch = entry.entryMethod === PUNCH_ENTRY_METHOD;
  const createdKind: ActivityKind = isPunch
    ? "punchStarted"
    : entry.entryMethod === COPY_ENTRY_METHOD
      ? "entryCopied"
      : "manualAdded";
  const events = [entryEvent(entry, createdKind, entry.createdAt, !isPunch)];

  if (entry.isDeleted) {
    if (isPunch && entry.deletedAt) {
      events.push(entryEvent(entry, "punchCancelled", entry.deletedAt, false));
    }
    return events;
  }

  const settledAt = isPunch && entry.end ? entry.end : entry.createdAt;
  const wasEdited =
    Math.abs(entry.updatedAt.getTime() - settledAt.getTime()) >
    ACTIVITY_EDIT_GRACE_MS;

  if (wasEdited) {
    events.push(entryEvent(entry, "entryEdited", entry.updatedAt, true));
  } else if (isPunch && entry.end) {
    events.push(entryEvent(entry, "punchEnded", entry.end, true));
  }
  return events;
}

function frozenEvents(frozenWeek: ActivityFrozenWeek | null): ActivityEvent[] {
  if (!frozenWeek) {
    return [];
  }
  const note = `${formatTimeDisplay(frozenWeek.weekTotal)} ${ACTIVITY_OUT_OF_LABEL} ${formatTimeDisplay(frozenWeek.objective)}`;
  if (!frozenWeek.isDeleted) {
    return [weekEvent("weekFrozen", frozenWeek.updatedAt, note)];
  }
  return [
    weekEvent("weekFrozen", frozenWeek.createdAt, note),
    weekEvent("weekUnfrozen", frozenWeek.updatedAt, null),
  ];
}

function objectiveEvents(
  objective: ActivityObjective | null,
  kilometrage: number,
): ActivityEvent[] {
  if (!objective) {
    return [];
  }
  const note = [
    formatTimeDisplay(objective.objective),
    kilometrage > 0 ? `${kilometrage} ${ACTIVITY_KILOMETRAGE_UNIT}` : null,
  ]
    .filter(Boolean)
    .join(ACTIVITY_DETAIL_SEPARATOR);
  return [weekEvent("objectivesSaved", objective.updatedAt, note)];
}

function compareEvents(a: ActivityEvent, b: ActivityEvent): number {
  return (
    b.at.getTime() - a.at.getTime() ||
    ACTIVITY_KINDS.indexOf(a.kind) - ACTIVITY_KINDS.indexOf(b.kind) ||
    a.id.localeCompare(b.id)
  );
}

function isConcurrent(previous: ActivityEvent, event: ActivityEvent): boolean {
  return (
    previous.kind === event.kind &&
    ACTIVITY_GROUPABLE_KINDS.includes(event.kind) &&
    Math.abs(previous.at.getTime() - event.at.getTime()) <=
      ACTIVITY_GROUP_WINDOW_MS
  );
}

function mergeConcurrent(events: readonly ActivityEvent[]): ActivityEvent[] {
  return events.reduce<ActivityEvent[]>((merged, event) => {
    const previous = merged[merged.length - 1];
    if (previous && isConcurrent(previous, event)) {
      merged[merged.length - 1] = {
        ...previous,
        names: [...new Set([...previous.names, ...event.names])],
      };
    } else {
      merged.push(event);
    }
    return merged;
  }, []);
}

export function buildActivityEvents({
  entries,
  frozenWeek,
  objective,
  kilometrage,
}: ActivitySource): ActivityEvent[] {
  const events = [
    ...entries.flatMap(entryEvents),
    ...frozenEvents(frozenWeek),
    ...objectiveEvents(objective, kilometrage),
  ].sort(compareEvents);
  return mergeConcurrent(events);
}

export function activityDetail({ names, hours, note }: ActivityEvent): string {
  return [
    names.join(ACTIVITY_NAME_SEPARATOR),
    hours === null ? null : formatTimeDisplay(hours),
    note,
  ]
    .filter(Boolean)
    .join(ACTIVITY_DETAIL_SEPARATOR);
}

export function groupActivityByDay(
  events: readonly ActivityEvent[],
): ActivityDay[] {
  return events.reduce<ActivityDay[]>((days, event) => {
    const dayKey = toLocalDateKey(event.at);
    const last = days[days.length - 1];
    if (last?.dayKey === dayKey) {
      last.events.push(event);
    } else {
      days.push({ dayKey, events: [event] });
    }
    return days;
  }, []);
}

export function activityDayLabel(dayKey: DateKey): string {
  return dayHeadingFormatter.format(toDbDate(dayKey));
}

export function formatActivityTime(at: Date): string {
  return timeFormatter.format(at);
}
