import { describe, it, expect } from "vitest";

import { EVENT_COLOR_BG_CLASSES } from "@/constants/calendar";
import {
  CalendarEventColor,
  CalendarEventType,
  RecurrenceEnd,
  RecurrenceFrequency,
} from "@/generated/prisma/enums";
import {
  addDays,
  buildWeeks,
  calendarDayPath,
  calendarEventPath,
  calendarWeekPath,
  dayOrderPreview,
  eventCategory,
  eventColorClass,
  eventCountLabel,
  expandOccurrences,
  fittingWeekCount,
  formatDayLabel,
  formatDayNumber,
  formatHour,
  formatWeekMonthLabel,
  isDateKey,
  isFilterVisible,
  isOneOf,
  matchesSearch,
  mondayOf,
  newCalendarEventPath,
  occurrenceDates,
  occurrenceSubtitle,
  ordinal,
  parseDateParam,
  parseWeekParam,
  parseWeekdays,
  toLocalDateKey,
  toLocalHour,
  toggleFilter,
  uniqueTemplates,
  weekRangeEnd,
  type CalendarEventRecord,
} from "@/lib/calendar";

const event = (
  overrides: Partial<CalendarEventRecord> = {},
): CalendarEventRecord => ({
  id: 1,
  type: CalendarEventType.manuel,
  title: "Réunion d'équipe",
  detail: "",
  date: "2026-07-06",
  hour: 8,
  color: CalendarEventColor.indigo,
  frequency: null,
  interval: 1,
  weekdays: [],
  endType: RecurrenceEnd.never,
  endDate: null,
  endCount: null,
  ...overrides,
});

describe("isDateKey", () => {
  it("accepts real calendar dates", () => {
    expect(isDateKey("2026-07-14")).toBe(true);
  });

  it("rejects impossible or malformed dates", () => {
    expect(isDateKey("2026-02-30")).toBe(false);
    expect(isDateKey("2026-7-14")).toBe(false);
    expect(isDateKey(undefined)).toBe(false);
  });
});

describe("date arithmetic", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("finds the monday of any day", () => {
    expect(mondayOf("2026-07-14")).toBe("2026-07-13");
    expect(mondayOf("2026-07-19")).toBe("2026-07-13");
  });

  it("ends a range on the last sunday", () => {
    expect(weekRangeEnd("2026-07-13", 2)).toBe("2026-07-26");
  });

  it("reads instants in the shop time zone", () => {
    const evening = new Date("2026-07-15T02:30:00.000Z");
    expect(toLocalDateKey(evening)).toBe("2026-07-14");
    expect(toLocalHour(evening)).toBe(22);
  });
});

describe("params and paths", () => {
  it("normalizes the week param to its monday", () => {
    expect(parseWeekParam("2026-07-16", "2026-01-01")).toBe("2026-07-13");
    expect(parseWeekParam("nope", "2026-07-16")).toBe("2026-07-13");
    expect(parseWeekParam(["2026-07-20"], "2026-01-01")).toBe("2026-07-20");
  });

  it("falls back for invalid date params", () => {
    expect(parseDateParam("2026-07-16", "2026-01-01")).toBe("2026-07-16");
    expect(parseDateParam(undefined, "2026-01-01")).toBe("2026-01-01");
  });

  it("builds calendar paths", () => {
    expect(calendarWeekPath("2026-07-13")).toBe(
      "/calendrier?semaine=2026-07-13",
    );
    expect(calendarDayPath("2026-07-14")).toBe("/calendrier/2026-07-14");
    expect(calendarEventPath(7)).toBe("/calendrier/evenements/7");
    expect(newCalendarEventPath()).toBe("/calendrier/evenements/nouveau");
    expect(newCalendarEventPath("2026-07-14")).toBe(
      "/calendrier/evenements/nouveau?date=2026-07-14",
    );
  });
});

describe("occurrenceDates", () => {
  it("returns one-off events inside the range only", () => {
    expect(occurrenceDates(event(), "2026-07-01", "2026-07-31")).toEqual([
      "2026-07-06",
    ]);
    expect(occurrenceDates(event(), "2026-07-07", "2026-07-31")).toEqual([]);
  });

  it("repeats daily on the interval", () => {
    const daily = event({ frequency: RecurrenceFrequency.daily, interval: 3 });
    expect(occurrenceDates(daily, "2026-07-05", "2026-07-15")).toEqual([
      "2026-07-06",
      "2026-07-09",
      "2026-07-12",
      "2026-07-15",
    ]);
  });

  it("repeats weekly on chosen weekdays every other week", () => {
    const weekly = event({
      frequency: RecurrenceFrequency.weekly,
      interval: 2,
      weekdays: [1, 4],
    });
    expect(occurrenceDates(weekly, "2026-07-06", "2026-07-26")).toEqual([
      "2026-07-06",
      "2026-07-09",
      "2026-07-20",
      "2026-07-23",
    ]);
  });

  it("repeats monthly on the same day and skips short months", () => {
    const monthly = event({
      date: "2026-01-31",
      frequency: RecurrenceFrequency.monthly,
    });
    expect(occurrenceDates(monthly, "2026-01-01", "2026-04-30")).toEqual([
      "2026-01-31",
      "2026-03-31",
    ]);
  });

  it("repeats yearly on the same date", () => {
    const yearly = event({
      date: "2024-07-06",
      frequency: RecurrenceFrequency.yearly,
      interval: 2,
    });
    expect(occurrenceDates(yearly, "2025-01-01", "2026-12-31")).toEqual([
      "2026-07-06",
    ]);
  });

  it("stops at the end date", () => {
    const ending = event({
      frequency: RecurrenceFrequency.daily,
      endType: RecurrenceEnd.date,
      endDate: "2026-07-08",
    });
    expect(occurrenceDates(ending, "2026-07-01", "2026-07-31")).toEqual([
      "2026-07-06",
      "2026-07-07",
      "2026-07-08",
    ]);
  });

  it("counts occurrences from the start, even before the range", () => {
    const counted = event({
      frequency: RecurrenceFrequency.daily,
      endType: RecurrenceEnd.count,
      endCount: 4,
    });
    expect(occurrenceDates(counted, "2026-07-08", "2026-07-31")).toEqual([
      "2026-07-08",
      "2026-07-09",
    ]);
  });
});

describe("expandOccurrences and buildWeeks", () => {
  const events = [
    event({
      id: 1,
      frequency: RecurrenceFrequency.weekly,
      weekdays: [1],
      date: "2026-06-01",
    }),
    event({
      id: 2,
      type: CalendarEventType.livraison,
      title: "Gagné Paradis",
      date: "2026-07-06",
      hour: 7,
    }),
  ];
  const occurrences = expandOccurrences(events, "2026-07-06", "2026-07-19");

  it("sorts occurrences by date then hour", () => {
    expect(occurrences.map(({ key }) => key)).toEqual([
      "2-2026-07-06",
      "1-2026-07-06",
      "1-2026-07-13",
    ]);
  });

  it("categorizes recurring events apart from their type", () => {
    expect(occurrences.map(({ category }) => category)).toEqual([
      "livraison",
      "recurrent",
      "recurrent",
    ]);
    expect(eventCategory(events[1])).toBe("livraison");
  });

  it("places occurrences in their day and flags special days", () => {
    const weeks = buildWeeks("2026-06-29", 3, "2026-07-01", occurrences);
    const [firstWeek, secondWeek] = weeks;
    expect(weeks.map(({ start }) => start)).toEqual([
      "2026-06-29",
      "2026-07-06",
      "2026-07-13",
    ]);
    expect(firstWeek.days[2]).toMatchObject({
      isToday: true,
      isMonthStart: true,
    });
    expect(firstWeek.days[5].isWeekend).toBe(true);
    expect(secondWeek.days[0].occurrences).toHaveLength(2);
  });
});

describe("formatting", () => {
  it("names noon and midnight", () => {
    expect(formatHour(0)).toBe("Minuit");
    expect(formatHour(12)).toBe("Midi");
    expect(formatHour(9)).toBe("9 h");
  });

  it("uses the detail, or the hour, as subtitle", () => {
    expect(occurrenceSubtitle({ detail: "Quai 2", hour: 9 })).toBe("Quai 2");
    expect(occurrenceSubtitle({ detail: "", hour: 9 })).toBe("9 h");
  });

  it("formats labels in Québec French", () => {
    expect(formatDayLabel("2026-07-14")).toBe("mardi 14 juillet 2026");
    expect(formatWeekMonthLabel("2026-06-29")).toBe("juillet 2026");
    expect(formatDayNumber("2026-07-14")).toBe("14");
    expect(formatDayNumber("2026-07-01")).toMatch(/^1 juil/);
    expect(ordinal(1)).toBe("1er");
    expect(ordinal(3)).toBe("3e");
  });

  it("pluralizes event counts", () => {
    expect(eventCountLabel(1)).toBe("1 événement");
    expect(eventCountLabel(3)).toBe("3 événements");
  });

  it("maps colors to background classes", () => {
    expect(eventColorClass(CalendarEventColor.teal)).toBe(
      EVENT_COLOR_BG_CLASSES.teal,
    );
  });
});

describe("filters", () => {
  it("searches title and detail, ignoring case", () => {
    const occurrence = { title: "Gagné Paradis", detail: "Camion 5T" };
    expect(matchesSearch(occurrence, "gagné")).toBe(true);
    expect(matchesSearch(occurrence, "CAMION")).toBe(true);
    expect(matchesSearch(occurrence, "tremblay")).toBe(false);
  });

  it("shows everything when no filter is active", () => {
    expect(isFilterVisible("manuel", new Set())).toBe(true);
    expect(isFilterVisible("manuel", new Set(["livraison"]))).toBe(false);
  });

  it("resets when every filter is toggled on", () => {
    const all = ["a", "b"];
    expect([...toggleFilter(new Set<string>(), "a", all)]).toEqual(["a"]);
    expect([...toggleFilter(new Set(["a"]), "a", all)]).toEqual([]);
    expect([...toggleFilter(new Set(["a"]), "b", all)]).toEqual([]);
  });

  it("guards enum values", () => {
    expect(isOneOf(["a", "b"], "a")).toBe(true);
    expect(isOneOf(["a", "b"], "")).toBe(false);
  });
});

describe("dayOrderPreview", () => {
  const item = (title: string, hour: number) => ({
    title,
    hour,
    date: "2026-07-14",
  });

  it("places the draft after existing events at the same hour", () => {
    const { items, position } = dayOrderPreview(
      [item("A", 8), item("B", 10), item("C", 9)],
      item("Nouveau", 9),
    );
    expect(items.map(({ title }) => title)).toEqual(["A", "C", "Nouveau", "B"]);
    expect(position).toBe(3);
  });

  it("is first on an empty day", () => {
    expect(dayOrderPreview([], item("Nouveau", 9)).position).toBe(1);
  });
});

describe("parseWeekdays", () => {
  it("keeps unique valid weekdays in order", () => {
    expect(parseWeekdays("4,1,,9,1,x", ",")).toEqual([1, 4]);
  });
});

describe("uniqueTemplates", () => {
  it("keeps the last template per title, sorted", () => {
    expect(
      uniqueTemplates([
        { title: "Côté", color: "blue", type: "livraison" },
        { title: "Arsenault", color: "teal", type: "manuel" },
        { title: "Côté", color: "pink", type: "installation" },
      ]),
    ).toEqual([
      { title: "Arsenault", color: "teal", type: "manuel" },
      { title: "Côté", color: "pink", type: "installation" },
    ]);
  });
});

describe("fittingWeekCount", () => {
  it("fits as many rows as the height allows, within bounds", () => {
    expect(fittingWeekCount(700, 128, 12)).toBe(5);
    expect(fittingWeekCount(50, 128, 12)).toBe(1);
    expect(fittingWeekCount(5000, 128, 12)).toBe(12);
  });
});
