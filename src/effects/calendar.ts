import { Effect } from "effect";

import {
  EVENT_DELETED_MESSAGE,
  EVENT_NOT_FOUND_MESSAGE,
  EVENT_SAVED_MESSAGE,
} from "@/constants/calendar";
import { getActiveSession } from "@/effects/auth";
import { accessibleProjectsWhere } from "@/effects/projects";
import type { PrismaService } from "@/generated/effect-prisma";
import { CalendarEventType, Role } from "@/generated/prisma/enums";
import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import type { CalendarEventWhereInput } from "@/generated/prisma/models";
import {
  expandOccurrences,
  toDbDate,
  uniqueTemplates,
  type DateKey,
} from "@/lib/calendar";
import { eventDataFromForm, eventRecordFromDb } from "@/lib/calendarEvents";
import type {
  CalendarEventFormData,
  CalendarEventFormState,
} from "@/schemas/calendar.schemas";

function eventsInRange(from: DateKey, to: DateKey): CalendarEventWhereInput {
  return {
    OR: [
      { frequency: null, date: { gte: toDbDate(from), lte: toDbDate(to) } },
      {
        frequency: { not: null },
        date: { lte: toDbDate(to) },
        OR: [{ endDate: null }, { endDate: { gte: toDbDate(from) } }],
      },
    ],
  };
}

const visibleEventsWhere = Effect.fn("visibleEventsWhere")(function* () {
  const session = yield* getActiveSession();
  return {
    OR: [
      { type: { not: CalendarEventType.personnel } },
      { ownerId: session.userId },
    ],
  } satisfies CalendarEventWhereInput;
});

export const getCalendarOccurrencesEffect = Effect.fn("getCalendarOccurrences")(
  function* (prisma: PrismaService, from: DateKey, to: DateKey) {
    const visible = yield* visibleEventsWhere();
    const events = yield* prisma.calendarEvent.findMany({
      where: { AND: [eventsInRange(from, to), visible] },
    });
    yield* Effect.annotateLogsScoped({
      calendarFrom: from,
      calendarTo: to,
      calendarEvents: events.length,
    });
    return expandOccurrences(events.map(eventRecordFromDb), from, to);
  },
);

const accessibleEventsWhere = Effect.fn("accessibleEventsWhere")(function* (
  prisma: PrismaService,
) {
  const session = yield* getActiveSession();
  if (session.role === Role.manager) {
    return {} satisfies CalendarEventWhereInput;
  }
  const project = yield* accessibleProjectsWhere(prisma);
  return project
    ? ({ project: { is: project } } satisfies CalendarEventWhereInput)
    : null;
});

export const getProjectOccurrencesEffect = Effect.fn("getProjectOccurrences")(
  function* (prisma: PrismaService, from: DateKey, to: DateKey) {
    const accessible = yield* accessibleEventsWhere(prisma);
    if (!accessible) {
      return [];
    }
    const visible = yield* visibleEventsWhere();
    const events = yield* prisma.calendarEvent.findMany({
      where: { AND: [eventsInRange(from, to), accessible, visible] },
    });
    yield* Effect.annotateLogsScoped({
      calendarFrom: from,
      calendarTo: to,
      calendarEvents: events.length,
    });
    return expandOccurrences(events.map(eventRecordFromDb), from, to);
  },
);

export const getCalendarEventEffect = Effect.fn("getCalendarEvent")(function* (
  prisma: PrismaService,
  id: number,
) {
  const visible = yield* visibleEventsWhere();
  const event = yield* prisma.calendarEvent.findFirst({
    where: { AND: [{ id }, visible] },
  });
  return event ? eventRecordFromDb(event) : null;
});

export const getEventTemplatesEffect = Effect.fn("getEventTemplates")(
  function* (prisma: PrismaService) {
    const visible = yield* visibleEventsWhere();
    const templates = yield* prisma.calendarEvent.findMany({
      where: visible,
      select: { title: true, color: true, type: true },
      orderBy: { updatedAt: SortOrder.asc },
    });
    return uniqueTemplates(templates);
  },
);

const deleteCalendarEvent = Effect.fn("deleteCalendarEvent")(function* (
  prisma: PrismaService,
  id: number,
  date: DateKey,
) {
  const visible = yield* visibleEventsWhere();
  const { count } = yield* prisma.calendarEvent.deleteMany({
    where: { AND: [{ id }, visible] },
  });
  return count === 0
    ? { errors: { dataValidation: EVENT_NOT_FOUND_MESSAGE } }
    : { message: EVENT_DELETED_MESSAGE, date };
});

export const saveCalendarEventEffect = Effect.fn("saveCalendarEvent")(
  function* (
    prisma: PrismaService,
    _formState: CalendarEventFormState,
    form: CalendarEventFormData,
  ) {
    const id = form.id ? Number(form.id) : undefined;
    if (id !== undefined && !Number.isInteger(id)) {
      return { errors: { dataValidation: EVENT_NOT_FOUND_MESSAGE } };
    }
    yield* Effect.annotateLogsScoped({
      calendarEventId: id,
      command: form.command,
    });
    if (form.command === "delete") {
      return id === undefined
        ? { errors: { dataValidation: EVENT_NOT_FOUND_MESSAGE } }
        : yield* deleteCalendarEvent(prisma, id, form.date);
    }
    const session = yield* getActiveSession();
    const result = eventDataFromForm(form, session.userId);
    if ("errors" in result) {
      return { errors: result.errors };
    }
    if (id === undefined) {
      yield* prisma.calendarEvent.create({ data: result.data });
      return { message: EVENT_SAVED_MESSAGE, date: form.date };
    }
    const visible = yield* visibleEventsWhere();
    const { count } = yield* prisma.calendarEvent.updateMany({
      where: { AND: [{ id }, visible] },
      data: result.data,
    });
    return count === 0
      ? { errors: { dataValidation: EVENT_NOT_FOUND_MESSAGE } }
      : { message: EVENT_SAVED_MESSAGE, date: form.date };
  },
);
