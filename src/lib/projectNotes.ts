import {
  CALENDAR_LOCALE,
  CALENDAR_TIME_ZONE,
  HOURS_PER_DAY,
} from "@/constants/calendar";
import {
  AUTHOR_INITIALS_LENGTH,
  JUST_NOW_LABEL,
  NOTE_AUTHOR_COLOR_CLASSES,
  NOTE_PLURAL_LABEL,
  NOTE_SINGULAR_LABEL,
  UNKNOWN_AUTHOR_COLOR_CLASS,
  UNKNOWN_AUTHOR_INITIALS,
} from "@/constants/projects";
import type {
  ProjectNote,
  ProjectNoteVersion,
  User,
} from "@/generated/prisma/client";
import type { PhaseRecord } from "@/lib/projects";

const MS_PER_MINUTE = 60 * 1000;
const MINUTES_PER_HOUR = 60;
const HASH_MULTIPLIER = 31;

export type NoteAuthor = Pick<User, "id" | "name">;

export type NoteVersionRecord = Pick<
  ProjectNoteVersion,
  "id" | "body" | "stage" | "createdAt"
> & { author: NoteAuthor | null };

export type NoteRecord = Pick<ProjectNote, "id" | "phaseId" | "isDeleted"> & {
  versions: NoteVersionRecord[];
};

export type NoteSection = {
  phase: PhaseRecord | null;
  notes: NoteRecord[];
};

const relativeTimeFormatter = new Intl.RelativeTimeFormat(CALENDAR_LOCALE, {
  style: "short",
});

const shortDateTimeFormatter = new Intl.DateTimeFormat(CALENDAR_LOCALE, {
  timeZone: CALENDAR_TIME_ZONE,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const fullDateTimeFormatter = new Intl.DateTimeFormat(CALENDAR_LOCALE, {
  timeZone: CALENDAR_TIME_ZONE,
  dateStyle: "long",
  timeStyle: "short",
});

export function noteSections(
  phases: readonly PhaseRecord[],
  notes: readonly NoteRecord[],
): NoteSection[] {
  return [null, ...phases].map((phase) => ({
    phase,
    notes: notes.filter(({ phaseId }) => phaseId === (phase?.id ?? null)),
  }));
}

export function currentVersion(note: NoteRecord): NoteVersionRecord {
  return note.versions[note.versions.length - 1];
}

export function previousVersions(note: NoteRecord): NoteVersionRecord[] {
  return note.versions.slice(0, -1).reverse();
}

export function activeNoteCount(notes: readonly NoteRecord[]): number {
  return notes.filter(({ isDeleted }) => !isDeleted).length;
}

export function noteCountLabel(count: number): string {
  return `${count} ${count > 1 ? NOTE_PLURAL_LABEL : NOTE_SINGULAR_LABEL}`;
}

export function authorInitials(author: NoteAuthor | null): string {
  const initials = (author?.name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, AUTHOR_INITIALS_LENGTH)
    .toLocaleUpperCase(CALENDAR_LOCALE);
  return initials || UNKNOWN_AUTHOR_INITIALS;
}

export function authorColorClass(author: NoteAuthor | null): string {
  if (!author) {
    return UNKNOWN_AUTHOR_COLOR_CLASS;
  }
  const hash = [...author.id].reduce(
    (sum, char) => (sum * HASH_MULTIPLIER + char.charCodeAt(0)) >>> 0,
    0,
  );
  return NOTE_AUTHOR_COLOR_CLASSES[hash % NOTE_AUTHOR_COLOR_CLASSES.length];
}

export function formatNoteTime(date: Date, now: Date): string {
  const minutes = Math.round((now.getTime() - date.getTime()) / MS_PER_MINUTE);
  if (minutes < 1) {
    return JUST_NOW_LABEL;
  }
  if (minutes < MINUTES_PER_HOUR) {
    return relativeTimeFormatter.format(-minutes, "minute");
  }
  const hours = Math.round(minutes / MINUTES_PER_HOUR);
  if (hours < HOURS_PER_DAY) {
    return relativeTimeFormatter.format(-hours, "hour");
  }
  return shortDateTimeFormatter.format(date);
}

export function formatNoteFullTime(date: Date): string {
  return fullDateTimeFormatter.format(date);
}
