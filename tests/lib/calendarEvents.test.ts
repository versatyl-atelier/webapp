import { describe, it, expect } from "vitest";

import {
  END_DATE_BEFORE_START_MESSAGE,
  INVALID_END_COUNT_MESSAGE,
  REPEATS_VALUE,
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

const form = (
  overrides: Partial<CalendarEventFormData> = {},
): CalendarEventFormData => ({
  command: "save",
  type: CalendarEventType.manuel,
  title: "Réunion",
  detail: "",
  date: "2026-07-14",
  hour: 8,
  color: CalendarEventColor.indigo,
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
  it("ignores recurrence unless a manual event repeats", () => {
    for (const overrides of [
      { repeats: undefined },
      { type: CalendarEventType.livraison },
    ]) {
      const result = eventDataFromForm(form(overrides));
      expect(result).toMatchObject({
        data: { frequency: null, weekdays: [], endType: RecurrenceEnd.never },
      });
    }
  });

  it("defaults weekly recurrences to the start weekday", () => {
    expect(eventDataFromForm(form())).toMatchObject({
      data: { frequency: RecurrenceFrequency.weekly, weekdays: [2] },
    });
  });

  it("drops weekdays for non-weekly recurrences", () => {
    expect(
      eventDataFromForm(
        form({ frequency: RecurrenceFrequency.monthly, weekdays: "1,3" }),
      ),
    ).toMatchObject({ data: { weekdays: [] } });
  });

  it("stores the date as a UTC midnight", () => {
    const result = eventDataFromForm(form({ repeats: undefined }));
    expect("data" in result && result.data.date.toISOString()).toBe(
      "2026-07-14T00:00:00.000Z",
    );
  });

  it("validates the end of the recurrence", () => {
    expect(
      eventDataFromForm(
        form({ endType: RecurrenceEnd.date, endDate: "2026-07-01" }),
      ),
    ).toEqual({ errors: { endDate: [END_DATE_BEFORE_START_MESSAGE] } });
    expect(
      eventDataFromForm(form({ endType: RecurrenceEnd.count, endCount: "0" })),
    ).toEqual({ errors: { endCount: [INVALID_END_COUNT_MESSAGE] } });
    expect(
      eventDataFromForm(form({ endType: RecurrenceEnd.count, endCount: "3" })),
    ).toMatchObject({ data: { endCount: 3, endDate: null } });
  });
});

describe("eventRecordFromDb", () => {
  it("serializes dates as date keys", () => {
    const now = new Date();
    expect(
      eventRecordFromDb({
        id: 3,
        type: CalendarEventType.manuel,
        title: "T",
        detail: "",
        date: new Date("2026-07-14T00:00:00.000Z"),
        hour: 9,
        color: CalendarEventColor.blue,
        frequency: RecurrenceFrequency.daily,
        interval: 1,
        weekdays: [],
        endType: RecurrenceEnd.date,
        endDate: new Date("2026-07-20T00:00:00.000Z"),
        endCount: null,
        trelloCardId: null,
        createdAt: now,
        updatedAt: now,
      }),
    ).toMatchObject({ date: "2026-07-14", endDate: "2026-07-20" });
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

  it("skips cards without a due date", () => {
    expect(
      trelloCardToEventData(
        { id: "c", name: "X", due: null, labels: [] },
        board,
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
      ),
    ).toMatchObject({
      trelloCardId: "c1",
      type: CalendarEventType.livraison,
      title: "Gagné Paradis",
      detail: "Trello",
      date: new Date("2026-07-14T00:00:00.000Z"),
      hour: 21,
      color: CalendarEventColor.blue,
      frequency: null,
    });
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
      )?.color,
    ).toBe(CalendarEventColor.lime);
  });
});
