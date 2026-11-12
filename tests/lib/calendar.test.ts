import { describe, it, expect } from "vitest";

import { NAMED_COLORS } from "@/constants/color";
import {
  CalendarEventType,
  RecurrenceEnd,
  RecurrenceFrequency,
} from "@/generated/prisma/enums";
import {
  addDays,
  buildWeeks,
  canRepeat,
  calendarDayPath,
  calendarEventPath,
  calendarWeekPath,
  eventCategory,
  eventCountLabel,
  expandOccurrences,
  fittingWeekCount,
  formatDayLabel,
  formatDayNumber,
  formatHour,
  formatDayMonth,
  formatWeekLabel,
  formatWeekMonthLabel,
  isDateKey,
  isFilterVisible,
  isOneOf,
  isWeekend,
  linkableProjects,
  matchesSearch,
  mondayOf,
  monthStartWeek,
  newCalendarEventPath,
  occurrenceDates,
  occurrenceDescription,
  occurrenceHref,
  occurrenceMeta,
  occurrenceSubtitle,
  parseDateParam,
  parseWeekParam,
  parseWeekdays,
  toLocalDateKey,
  toLocalHour,
  toggleFilter,
  occurrenceTitle,
  weekRangeEnd,
  type CalendarEventRecord,
} from "@/lib/calendar";

const event = (
  overrides: Partial<CalendarEventRecord> = {},
): CalendarEventRecord => ({
  id: 1,
  type: CalendarEventType.divers,
  subcategory: "",
  title: "Réunion d'équipe",
  detail: "",
  date: "2026-07-06",
  spanEndDate: null,
  hour: 8,
  color: NAMED_COLORS.indigo,
  frequency: null,
  interval: 1,
  weekdays: [],
  endType: RecurrenceEnd.never,
  endDate: null,
  endCount: null,
  projectId: null,
  projectName: null,
  projectColor: null,
  ownerId: null,
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

describe("isWeekend", () => {
  it("is true for saturday and sunday only", () => {
    expect(isWeekend("2026-11-06")).toBe(false);
    expect(isWeekend("2026-11-07")).toBe(true);
    expect(isWeekend("2026-11-08")).toBe(true);
    expect(isWeekend("2026-11-09")).toBe(false);
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

  it("puts every recurring divers and personal event in recurrent", () => {
    for (const type of [
      CalendarEventType.divers,
      CalendarEventType.personnel,
    ]) {
      expect(
        eventCategory({ type, frequency: RecurrenceFrequency.weekly }),
      ).toBe("recurrent");
      expect(eventCategory({ type, frequency: null })).toBe(type);
    }
  });

  it("only lets divers and personal events repeat", () => {
    expect(canRepeat(CalendarEventType.divers)).toBe(true);
    expect(canRepeat(CalendarEventType.personnel)).toBe(true);
    expect(canRepeat(CalendarEventType.livraison)).toBe(false);
    expect(canRepeat(CalendarEventType.installation)).toBe(false);
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

  it("uses the subcategory and detail, or the hour, as subtitle", () => {
    expect(
      occurrenceSubtitle({
        subcategory: "",
        detail: "Quai 2",
        hour: 9,
        allDay: false,
      }),
    ).toBe("Quai 2");
    expect(
      occurrenceSubtitle({
        subcategory: "",
        detail: "",
        hour: 9,
        allDay: false,
      }),
    ).toBe("9 h");
    expect(
      occurrenceSubtitle({
        subcategory: "RH",
        detail: "Bureau",
        hour: 9,
        allDay: false,
      }),
    ).toBe("RH · Bureau");
  });

  it("describes the hour, subcategory and detail", () => {
    const occurrence = {
      subcategory: "Formation",
      detail: "Salle de pause",
      hour: 9,
      title: "SIMDUT",
      allDay: false,
    };
    expect(occurrenceMeta(occurrence)).toBe("9 h · Formation · Salle de pause");
    expect(occurrenceDescription(occurrence)).toBe(
      "9 h — SIMDUT · Formation · Salle de pause",
    );
    expect(
      occurrenceDescription({ ...occurrence, subcategory: "", detail: "" }),
    ).toBe("9 h — SIMDUT");
  });

  it("leaves out the hour of an all-day lanceur occurrence", () => {
    const occurrence = {
      subcategory: "(lanceur de dates)",
      detail: "",
      hour: 0,
      title: "Peter Rose · PDM",
      allDay: true,
    };
    expect(occurrenceMeta(occurrence)).toBe("(lanceur de dates)");
    expect(occurrenceSubtitle(occurrence)).toBe("(lanceur de dates)");
    expect(occurrenceDescription(occurrence)).toBe(
      "Peter Rose · PDM · (lanceur de dates)",
    );
  });

  it("formats labels in Québec French", () => {
    expect(formatDayLabel("2026-07-14")).toBe("mardi 14 juillet 2026");
    expect(formatWeekMonthLabel("2026-06-29")).toBe("juillet 2026");
    expect(formatWeekLabel("2026-09-28")).toMatch(/^28 sept\.?-4 oct\.?$/);
    expect(formatWeekLabel("2026-09-14")).toMatch(/^14-20 sept\.?$/);
    expect(formatDayNumber("2026-07-14")).toBe("14");
    expect(formatDayNumber("2026-07-01")).toMatch(/^1 juil/);
  });

  it("finds the first week of the displayed month", () => {
    expect(monthStartWeek("2026-07-20")).toBe("2026-06-29");
    expect(monthStartWeek("2026-06-29")).toBe("2026-06-29");
    expect(monthStartWeek("2026-10-26")).toBe("2026-09-28");
    expect(monthStartWeek("2026-09-21")).toBe("2026-08-31");
  });

  it("pluralizes event counts", () => {
    expect(eventCountLabel(1)).toBe("1 événement");
    expect(eventCountLabel(3)).toBe("3 événements");
  });
});

describe("filters", () => {
  it("searches title, subcategory and detail, ignoring case", () => {
    const occurrence = {
      title: "Gagné Paradis",
      subcategory: "Sécurité",
      detail: "Camion 5T",
    };
    expect(matchesSearch(occurrence, "gagné")).toBe(true);
    expect(matchesSearch(occurrence, "CAMION")).toBe(true);
    expect(matchesSearch(occurrence, "sécurité")).toBe(true);
    expect(matchesSearch(occurrence, "tremblay")).toBe(false);
  });

  it("shows everything when no filter is active", () => {
    expect(isFilterVisible("divers", new Set())).toBe(true);
    expect(isFilterVisible("divers", new Set(["livraison"]))).toBe(false);
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

describe("parseWeekdays", () => {
  it("keeps unique valid weekdays in order", () => {
    expect(parseWeekdays("4,1,,9,1,x", ",")).toEqual([1, 4]);
  });
});

describe("occurrenceDates for a span", () => {
  it("repeats every weekday until the span end", () => {
    expect(
      occurrenceDates(
        event({ date: "2026-11-05", spanEndDate: "2026-11-10" }),
        "2026-11-01",
        "2026-11-30",
      ),
    ).toEqual(["2026-11-05", "2026-11-06", "2026-11-09", "2026-11-10"]);
  });

  it("keeps a weekend start day and clips to the range", () => {
    expect(
      occurrenceDates(
        event({ date: "2026-11-07", spanEndDate: "2026-11-12" }),
        "2026-11-01",
        "2026-11-10",
      ),
    ).toEqual(["2026-11-07", "2026-11-09", "2026-11-10"]);
    expect(
      occurrenceDates(
        event({ date: "2026-11-05", spanEndDate: "2026-11-10" }),
        "2026-11-09",
        "2026-11-15",
      ),
    ).toEqual(["2026-11-09", "2026-11-10"]);
  });

  it("ignores a span end before the start", () => {
    expect(
      occurrenceDates(
        event({ date: "2026-11-05", spanEndDate: "2026-11-01" }),
        "2026-11-01",
        "2026-11-30",
      ),
    ).toEqual(["2026-11-05"]);
  });
});

describe("occurrenceTitle", () => {
  it("prefixes the linked project name", () => {
    expect(occurrenceTitle("Livraison", "Gagné Paradis")).toBe(
      "Gagné Paradis · Livraison",
    );
    expect(occurrenceTitle("Livraison", null)).toBe("Livraison");
  });

  it("does not repeat a project name already in the title", () => {
    expect(occurrenceTitle("gagné paradis — cuisine", "Gagné Paradis")).toBe(
      "gagné paradis — cuisine",
    );
  });

  it("uses the linked project color over the event color", () => {
    const [linked, unlinked] = expandOccurrences(
      [event({ id: 1, projectColor: "#112233" }), event({ id: 2, hour: 9 })],
      "2026-07-06",
      "2026-07-06",
    );
    expect(linked.color).toBe("#112233");
    expect(unlinked.color).toBe(NAMED_COLORS.indigo);
  });

  it("is used when expanding occurrences", () => {
    expect(
      expandOccurrences(
        [event({ projectName: "Côté" })],
        "2026-07-06",
        "2026-07-06",
      )[0].title,
    ).toBe("Côté · Réunion d'équipe");
  });
});

describe("fittingWeekCount", () => {
  it("fits as many rows as the height allows, within bounds", () => {
    expect(fittingWeekCount(700, 128, 12)).toBe(5);
    expect(fittingWeekCount(50, 128, 12)).toBe(1);
    expect(fittingWeekCount(5000, 128, 12)).toBe(12);
  });
});

describe("formatDayMonth", () => {
  it("formats a short French day and month", () => {
    expect(formatDayMonth("2026-05-08")).toBe("8 mai");
    expect(formatDayMonth("2026-06-23")).toBe("23 juin");
  });
});

describe("linkableProjects", () => {
  it("hides deleted projects unless the event is already linked to one", () => {
    const projects = [
      { id: "a", name: "A", color: "#3B7DD8", isDeleted: false },
      { id: "b", name: "B", color: "#3B7DD8", isDeleted: true },
      { id: "c", name: "C", color: "#3B7DD8", isDeleted: true },
    ];
    expect(linkableProjects(projects, null)).toEqual([
      { id: "a", name: "A", color: "#3B7DD8" },
    ]);
    expect(linkableProjects(projects, "c")).toEqual([
      { id: "a", name: "A", color: "#3B7DD8" },
      { id: "c", name: "C", color: "#3B7DD8" },
    ]);
  });
});

describe("occurrenceHref", () => {
  it("opens the event form for managers only", () => {
    expect(occurrenceHref({ href: null, eventId: 7 }, true)).toBe(
      calendarEventPath(7),
    );
    expect(occurrenceHref({ href: null, eventId: 7 }, false)).toBeNull();
  });

  it("keeps the own link of generated occurrences", () => {
    expect(occurrenceHref({ href: "/lanceur", eventId: 0 }, false)).toBe(
      "/lanceur",
    );
  });
});
