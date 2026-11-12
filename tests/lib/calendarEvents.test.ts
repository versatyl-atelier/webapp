import { describe, it, expect } from "vitest";

import {
  END_DATE_BEFORE_START_MESSAGE,
  INVALID_END_COUNT_MESSAGE,
  REPEATS_VALUE,
  SPAN_REPEATS_NOTE,
} from "@/constants/calendar";
import {
  CalendarEventColor,
  CalendarEventType,
  RecurrenceEnd,
  RecurrenceFrequency,
} from "@/generated/prisma/enums";
import {
  eventDataFromForm,
  eventRecordFromDb,
  trelloCardToEventData,
} from "@/lib/calendarEvents";
import type {
  CalendarEventFormData,
  TrelloBoardConfig,
} from "@/schemas/calendar.schemas";

const USER_ID = "u1";

const form = (
  overrides: Partial<CalendarEventFormData> = {},
): CalendarEventFormData => ({
  command: "save",
  type: CalendarEventType.divers,
  subcategory: "",
  title: "Réunion",
  detail: "",
  date: "2026-07-14",
  spanEndDate: "",
  hour: 8,
  color: CalendarEventColor.indigo,
  projectId: "",
  repeats: REPEATS_VALUE,
  frequency: RecurrenceFrequency.weekly,
  interval: 1,
  weekdays: "",
  endType: RecurrenceEnd.never,
  endDate: "",
  endCount: "10",
  ...overrides,
});

describe("eventDataFromForm", () => {
  it("ignores recurrence unless a repeatable event repeats", () => {
    for (const overrides of [
      { repeats: undefined },
      { type: CalendarEventType.livraison },
      { type: CalendarEventType.installation },
    ]) {
      const result = eventDataFromForm(form(overrides), USER_ID);
      expect(result).toMatchObject({
        data: { frequency: null, weekdays: [], endType: RecurrenceEnd.never },
      });
    }
  });

  it("lets divers and personal events repeat", () => {
    for (const type of [
      CalendarEventType.divers,
      CalendarEventType.personnel,
    ]) {
      expect(eventDataFromForm(form({ type }), USER_ID)).toMatchObject({
        data: { type, frequency: RecurrenceFrequency.weekly },
      });
    }
  });

  it("keeps the subcategory of divers events only", () => {
    expect(
      eventDataFromForm(
        form({ type: CalendarEventType.divers, subcategory: "RH" }),
        USER_ID,
      ),
    ).toMatchObject({ data: { subcategory: "RH" } });
    expect(
      eventDataFromForm(
        form({ type: CalendarEventType.personnel, subcategory: "RH" }),
        USER_ID,
      ),
    ).toMatchObject({
      data: { subcategory: "" },
    });
  });

  it("gives personal events to the current user only", () => {
    expect(
      eventDataFromForm(form({ type: CalendarEventType.personnel }), USER_ID),
    ).toMatchObject({ data: { ownerId: USER_ID } });
    expect(eventDataFromForm(form(), USER_ID)).toMatchObject({
      data: { ownerId: null },
    });
  });

  it("defaults weekly recurrences to the start weekday", () => {
    expect(eventDataFromForm(form(), USER_ID)).toMatchObject({
      data: { frequency: RecurrenceFrequency.weekly, weekdays: [2] },
    });
  });

  it("drops weekdays for non-weekly recurrences", () => {
    expect(
      eventDataFromForm(
        form({ frequency: RecurrenceFrequency.monthly, weekdays: "1,3" }),
        USER_ID,
      ),
    ).toMatchObject({ data: { weekdays: [] } });
  });

  it("stores the date as a UTC midnight", () => {
    const result = eventDataFromForm(form({ repeats: undefined }), USER_ID);
    expect("data" in result && result.data.date.toISOString()).toBe(
      "2026-07-14T00:00:00.000Z",
    );
  });

  it("validates the end of the recurrence", () => {
    expect(
      eventDataFromForm(
        form({ endType: RecurrenceEnd.date, endDate: "2026-07-01" }),
        USER_ID,
      ),
    ).toEqual({ errors: { endDate: [END_DATE_BEFORE_START_MESSAGE] } });
    expect(
      eventDataFromForm(
        form({ endType: RecurrenceEnd.count, endCount: "0" }),
        USER_ID,
      ),
    ).toEqual({ errors: { endCount: [INVALID_END_COUNT_MESSAGE] } });
    expect(
      eventDataFromForm(
        form({ endType: RecurrenceEnd.count, endCount: "3" }),
        USER_ID,
      ),
    ).toMatchObject({ data: { endCount: 3, endDate: null } });
  });

  it("links the event to a project only when one is chosen", () => {
    expect(eventDataFromForm(form(), USER_ID)).toMatchObject({
      data: { projectId: null },
    });
    expect(eventDataFromForm(form({ projectId: "p1" }), USER_ID)).toMatchObject(
      {
        data: { projectId: "p1" },
      },
    );
  });
});

describe("eventRecordFromDb", () => {
  it("serializes dates as date keys", () => {
    const now = new Date();
    expect(
      eventRecordFromDb({
        id: 3,
        type: CalendarEventType.divers,
        subcategory: "",
        title: "T",
        detail: "",
        date: new Date("2026-07-14T00:00:00.000Z"),
        spanEndDate: new Date("2026-07-16T00:00:00.000Z"),
        hour: 9,
        color: CalendarEventColor.blue,
        frequency: RecurrenceFrequency.daily,
        interval: 1,
        weekdays: [],
        endType: RecurrenceEnd.date,
        endDate: new Date("2026-07-20T00:00:00.000Z"),
        endCount: null,
        trelloCardId: null,
        projectId: "p1",
        ownerId: null,
        createdAt: now,
        updatedAt: now,
        project: { name: "Côté" },
      }),
    ).toMatchObject({
      date: "2026-07-14",
      spanEndDate: "2026-07-16",
      endDate: "2026-07-20",
      projectName: "Côté",
    });
  });
});

describe("eventDataFromForm span", () => {
  const oneOff = { repeats: undefined };

  it("stores the span end date of a one-off event", () => {
    expect(
      eventDataFromForm(
        form({ ...oneOff, spanEndDate: "2026-07-17" }),
        USER_ID,
      ),
    ).toMatchObject({
      data: { spanEndDate: new Date("2026-07-17T00:00:00.000Z") },
    });
  });

  it("drops an empty or same-day span", () => {
    for (const spanEndDate of ["", "2026-07-14"]) {
      expect(
        eventDataFromForm(form({ ...oneOff, spanEndDate }), USER_ID),
      ).toMatchObject({ data: { spanEndDate: null } });
    }
  });

  it("rejects a span ending before the start", () => {
    expect(
      eventDataFromForm(
        form({ ...oneOff, spanEndDate: "2026-07-10" }),
        USER_ID,
      ),
    ).toEqual({ errors: { spanEndDate: [END_DATE_BEFORE_START_MESSAGE] } });
  });

  it("rejects a span on a repeating event", () => {
    expect(
      eventDataFromForm(form({ spanEndDate: "2026-07-17" }), USER_ID),
    ).toEqual({ errors: { spanEndDate: [SPAN_REPEATS_NOTE] } });
  });
});

describe("trelloCardToEventData", () => {
  const board: TrelloBoardConfig = {
    name: "Échéancier",
    boardId: "b",
    apiKey: "k",
    apiToken: "t",
    type: CalendarEventType.livraison,
    color: CalendarEventColor.blue,
    detail: "Trello",
    labelColors: { green: CalendarEventColor.lime },
  };
  const noProjects = new Set<string>();

  it("skips cards without a due date", () => {
    expect(
      trelloCardToEventData(
        { id: "c", name: "X", due: null, labels: [] },
        board,
        noProjects,
      ),
    ).toBeNull();
  });

  it("uses the local day and hour of the due date", () => {
    expect(
      trelloCardToEventData(
        {
          id: "c1",
          name: " Gagné Paradis ",
          due: "2026-07-15T01:00:00.000Z",
          labels: [],
        },
        board,
        noProjects,
      ),
    ).toMatchObject({
      trelloCardId: "c1",
      type: CalendarEventType.livraison,
      title: "Gagné Paradis",
      detail: "Trello",
      date: new Date("2026-07-14T00:00:00.000Z"),
      hour: 21,
      color: CalendarEventColor.blue,
      projectId: null,
      ownerId: null,
      subcategory: "",
      frequency: null,
    });
  });

  it("links the event to the project of the same Trello card", () => {
    expect(
      trelloCardToEventData(
        {
          id: "c3",
          name: "Z",
          due: "2026-07-14T16:00:00.000Z",
          labels: [],
        },
        board,
        new Set(["c3"]),
      )?.projectId,
    ).toBe("c3");
  });

  it("maps label colors, including shade variants", () => {
    expect(
      trelloCardToEventData(
        {
          id: "c2",
          name: "Y",
          due: "2026-07-14T16:00:00.000Z",
          labels: [{ color: null }, { color: "green_dark" }],
        },
        board,
        noProjects,
      )?.color,
    ).toBe(CalendarEventColor.lime);
  });
});
