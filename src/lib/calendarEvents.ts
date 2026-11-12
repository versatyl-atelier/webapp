import {
  END_DATE_BEFORE_START_MESSAGE,
  INVALID_DATE_MESSAGE,
  INVALID_END_COUNT_MESSAGE,
  REPEATS_VALUE,
  SPAN_REPEATS_NOTE,
  TRELLO_COLOR_SHADE_SEPARATOR,
  WEEKDAYS_SEPARATOR,
} from "@/constants/calendar";
import type { CalendarEvent } from "@/generated/prisma/client";
import { NAMED_COLORS } from "@/constants/color";
import {
  CalendarEventType,
  RecurrenceEnd,
  RecurrenceFrequency,
} from "@/generated/prisma/enums";
import {
  canRepeat,
  isDateKey,
  parseWeekdays,
  toDateKey,
  toDbDate,
  toLocalDateKey,
  toLocalHour,
  weekdayOf,
  type CalendarEventRecord,
} from "@/lib/calendar";
import type {
  CalendarEventFormData,
  CalendarEventFormErrors,
  TrelloBoardConfig,
  TrelloCard,
} from "@/schemas/calendar.schemas";

export type CalendarEventData = Omit<
  CalendarEvent,
  "id" | "createdAt" | "updatedAt" | "trelloCardId"
>;

export type TrelloEventData = CalendarEventData & { trelloCardId: string };

export type CalendarEventWithProject = CalendarEvent & {
  project: { name: string; color: string } | null;
};

type SpanResult =
  | { spanEndDate: Date | null; errors?: never }
  | { errors: CalendarEventFormErrors };

const ONE_OFF: Pick<
  CalendarEventData,
  "frequency" | "interval" | "weekdays" | "endType" | "endDate" | "endCount"
> = {
  frequency: null,
  interval: 1,
  weekdays: [],
  endType: RecurrenceEnd.never,
  endDate: null,
  endCount: null,
};

export function eventRecordFromDb(
  event: CalendarEventWithProject,
): CalendarEventRecord {
  return {
    id: event.id,
    type: event.type,
    subcategory: event.subcategory,
    title: event.title,
    detail: event.detail,
    date: toDateKey(event.date),
    spanEndDate: event.spanEndDate ? toDateKey(event.spanEndDate) : null,
    hour: event.hour,
    color: event.color,
    frequency: event.frequency,
    interval: event.interval,
    weekdays: event.weekdays,
    endType: event.endType,
    endDate: event.endDate ? toDateKey(event.endDate) : null,
    endCount: event.endCount,
    projectId: event.projectId,
    projectName: event.project?.name ?? null,
    projectColor: event.project?.color ?? null,
    ownerId: event.ownerId,
  };
}

function isRepeating(form: CalendarEventFormData): boolean {
  return canRepeat(form.type) && form.repeats === REPEATS_VALUE;
}

function spanFromForm(form: CalendarEventFormData): SpanResult {
  if (!form.spanEndDate || form.spanEndDate === form.date) {
    return { spanEndDate: null };
  }
  if (!isDateKey(form.spanEndDate)) {
    return { errors: { spanEndDate: [INVALID_DATE_MESSAGE] } };
  }
  if (form.spanEndDate < form.date) {
    return { errors: { spanEndDate: [END_DATE_BEFORE_START_MESSAGE] } };
  }
  if (isRepeating(form)) {
    return { errors: { spanEndDate: [SPAN_REPEATS_NOTE] } };
  }
  return { spanEndDate: toDbDate(form.spanEndDate) };
}

function recurrenceFromForm(
  form: CalendarEventFormData,
):
  | { recurrence: typeof ONE_OFF; errors?: never }
  | { errors: CalendarEventFormErrors } {
  if (!isRepeating(form)) {
    return { recurrence: ONE_OFF };
  }
  const weekdays = parseWeekdays(form.weekdays, WEEKDAYS_SEPARATOR);
  const base = {
    frequency: form.frequency,
    interval: form.interval,
    weekdays:
      form.frequency !== RecurrenceFrequency.weekly
        ? []
        : weekdays.length > 0
          ? weekdays
          : [weekdayOf(form.date)],
  };
  switch (form.endType) {
    case RecurrenceEnd.date:
      if (!isDateKey(form.endDate)) {
        return { errors: { endDate: [INVALID_DATE_MESSAGE] } };
      }
      if (form.endDate < form.date) {
        return { errors: { endDate: [END_DATE_BEFORE_START_MESSAGE] } };
      }
      return {
        recurrence: {
          ...base,
          endType: RecurrenceEnd.date,
          endDate: toDbDate(form.endDate),
          endCount: null,
        },
      };
    case RecurrenceEnd.count: {
      const count = Number(form.endCount);
      if (!Number.isInteger(count) || count < 1) {
        return { errors: { endCount: [INVALID_END_COUNT_MESSAGE] } };
      }
      return {
        recurrence: {
          ...base,
          endType: RecurrenceEnd.count,
          endDate: null,
          endCount: count,
        },
      };
    }
    default:
      return {
        recurrence: {
          ...base,
          endType: RecurrenceEnd.never,
          endDate: null,
          endCount: null,
        },
      };
  }
}

export function eventDataFromForm(
  form: CalendarEventFormData,
  userId: string,
): { data: CalendarEventData } | { errors: CalendarEventFormErrors } {
  const span = spanFromForm(form);
  if (span.errors) {
    return { errors: span.errors };
  }
  const result = recurrenceFromForm(form);
  if (result.errors) {
    return { errors: result.errors };
  }
  return {
    data: {
      type: form.type,
      subcategory:
        form.type === CalendarEventType.divers ? form.subcategory : "",
      title: form.title,
      detail: form.detail,
      date: toDbDate(form.date),
      spanEndDate: span.spanEndDate,
      hour: form.hour,
      color: form.color,
      projectId: form.projectId || null,
      ownerId: form.type === CalendarEventType.personnel ? userId : null,
      ...result.recurrence,
    },
  };
}

function trelloLabelColor(
  color: string,
  { labelColors }: TrelloBoardConfig,
): string | undefined {
  const [baseColor] = color.split(TRELLO_COLOR_SHADE_SEPARATOR);
  const name = labelColors[color] ?? labelColors[baseColor];
  return name && NAMED_COLORS[name];
}

export function trelloCardToEventData(
  card: TrelloCard,
  board: TrelloBoardConfig,
  projectIds: ReadonlySet<string>,
): TrelloEventData | null {
  if (!card.due) {
    return null;
  }
  const due = new Date(card.due);
  const labelColor = card.labels
    .map(({ color }) => (color ? trelloLabelColor(color, board) : undefined))
    .find(Boolean);
  return {
    trelloCardId: card.id,
    type: board.type,
    subcategory: "",
    title: card.name.trim(),
    detail: board.detail,
    date: toDbDate(toLocalDateKey(due)),
    spanEndDate: null,
    hour: toLocalHour(due),
    color: labelColor ?? NAMED_COLORS[board.color],
    projectId: projectIds.has(card.id) ? card.id : null,
    ownerId: null,
    ...ONE_OFF,
  };
}
