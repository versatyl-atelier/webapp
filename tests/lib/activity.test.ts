import { describe, expect, it } from "vitest";

import {
  ACTIVITY_UNKNOWN_SUBJECT_LABEL,
  PUNCH_ENTRY_METHOD,
} from "@/constants/activity";
import { COPY_ENTRY_METHOD } from "@/constants/timeEntries";
import {
  activityDayLabel,
  activityDetail,
  buildActivityEvents,
  formatActivityTime,
  groupActivityByDay,
  type ActivityEntry,
  type ActivityEvent,
  type ActivitySource,
} from "@/lib/activity";

const at = (iso: string) => new Date(iso);

const entry = (overrides: Partial<ActivityEntry>): ActivityEntry => ({
  id: 1,
  start: at("2026-10-27T04:00:00Z"),
  end: at("2026-10-27T05:00:00Z"),
  entryMethod: "manual",
  isDeleted: false,
  deletedAt: null,
  createdAt: at("2026-10-27T14:00:00Z"),
  updatedAt: at("2026-10-27T14:00:00Z"),
  projects: [{ project: { name: "Gagné" }, task: null }],
  ...overrides,
});

const punch = (overrides: Partial<ActivityEntry>): ActivityEntry =>
  entry({
    entryMethod: PUNCH_ENTRY_METHOD,
    start: at("2026-10-27T12:00:00Z"),
    end: at("2026-10-27T15:30:00Z"),
    createdAt: at("2026-10-27T12:00:00Z"),
    updatedAt: at("2026-10-27T15:30:00Z"),
    ...overrides,
  });

const source = (overrides: Partial<ActivitySource>): ActivitySource => ({
  entries: [],
  frozenWeek: null,
  objective: null,
  kilometrage: 0,
  ...overrides,
});

const kinds = (events: ActivityEvent[]) => events.map(({ kind }) => kind);

describe("buildActivityEvents", () => {
  it("is empty when nothing happened", () => {
    expect(buildActivityEvents(source({}))).toEqual([]);
  });

  it("logs a manual entry once, with its duration", () => {
    const events = buildActivityEvents(source({ entries: [entry({})] }));
    expect(kinds(events)).toEqual(["manualAdded"]);
    expect(events[0]).toMatchObject({
      at: at("2026-10-27T14:00:00Z"),
      names: ["Gagné"],
      hours: 1,
    });
  });

  it("logs a finished punch as a start and an end", () => {
    const events = buildActivityEvents(source({ entries: [punch({})] }));
    expect(kinds(events)).toEqual(["punchEnded", "punchStarted"]);
    expect(events[0]).toMatchObject({
      at: at("2026-10-27T15:30:00Z"),
      hours: 3.5,
    });
    expect(events[1]).toMatchObject({
      at: at("2026-10-27T12:00:00Z"),
      hours: null,
    });
  });

  it("only logs the start of a punch still running", () => {
    const events = buildActivityEvents(
      source({
        entries: [punch({ end: null, updatedAt: at("2026-10-27T12:00:01Z") })],
      }),
    );
    expect(kinds(events)).toEqual(["punchStarted"]);
  });

  it("logs a cancelled punch instead of an end", () => {
    const events = buildActivityEvents(
      source({
        entries: [
          punch({
            end: null,
            isDeleted: true,
            deletedAt: at("2026-10-27T12:10:00Z"),
            updatedAt: at("2026-10-27T12:10:00Z"),
          }),
        ],
      }),
    );
    expect(kinds(events)).toEqual(["punchCancelled", "punchStarted"]);
  });

  it("merges the entries of a multi-project punch into one event", () => {
    const events = buildActivityEvents(
      source({
        entries: [
          punch({ id: 1 }),
          punch({
            id: 2,
            createdAt: at("2026-10-27T12:00:00.400Z"),
            projects: [{ project: null, task: { name: "Fabrication" } }],
          }),
          punch({
            id: 3,
            projects: [{ project: null, task: null }],
          }),
        ],
      }),
    );
    expect(kinds(events)).toEqual(["punchEnded", "punchStarted"]);
    expect(events[0].names).toEqual([
      "Gagné",
      "Fabrication",
      ACTIVITY_UNKNOWN_SUBJECT_LABEL,
    ]);
    expect([...events[1].names].sort()).toEqual(
      ["Gagné", "Fabrication", ACTIVITY_UNKNOWN_SUBJECT_LABEL].sort(),
    );
  });

  it("does not merge punches that are far apart", () => {
    const events = buildActivityEvents(
      source({
        entries: [
          punch({ id: 1 }),
          punch({
            id: 2,
            createdAt: at("2026-10-27T18:00:00Z"),
            start: at("2026-10-27T18:00:00Z"),
            end: at("2026-10-27T20:00:00Z"),
            updatedAt: at("2026-10-27T20:00:00Z"),
          }),
        ],
      }),
    );
    expect(kinds(events)).toEqual([
      "punchEnded",
      "punchStarted",
      "punchEnded",
      "punchStarted",
    ]);
  });

  it("logs an edited manual entry at the time of the edit", () => {
    const events = buildActivityEvents(
      source({
        entries: [entry({ updatedAt: at("2026-10-28T09:15:00Z") })],
      }),
    );
    expect(kinds(events)).toEqual(["entryEdited", "manualAdded"]);
    expect(events[0].at).toEqual(at("2026-10-28T09:15:00Z"));
  });

  it("logs an edited punch as an edit rather than an end", () => {
    const events = buildActivityEvents(
      source({
        entries: [punch({ updatedAt: at("2026-10-28T09:15:00Z") })],
      }),
    );
    expect(kinds(events)).toEqual(["entryEdited", "punchStarted"]);
  });

  it("logs a copied entry as a copy, with its duration", () => {
    const events = buildActivityEvents(
      source({ entries: [entry({ entryMethod: COPY_ENTRY_METHOD })] }),
    );
    expect(kinds(events)).toEqual(["entryCopied"]);
    expect(events[0].hours).toBe(1);
  });

  it("treats a legacy fill entry like a manual one", () => {
    const events = buildActivityEvents(
      source({ entries: [entry({ entryMethod: "fill" })] }),
    );
    expect(kinds(events)).toEqual(["manualAdded"]);
  });

  it("logs a frozen week at its last update", () => {
    const events = buildActivityEvents(
      source({
        frozenWeek: {
          weekTotal: 39.5,
          objective: 40,
          isDeleted: false,
          createdAt: at("2026-10-23T20:00:00Z"),
          updatedAt: at("2026-10-24T13:00:00Z"),
        },
      }),
    );
    expect(kinds(events)).toEqual(["weekFrozen"]);
    expect(events[0].at).toEqual(at("2026-10-24T13:00:00Z"));
    expect(activityDetail(events[0])).toBe("39h 30m sur 40h");
  });

  it("logs both the freeze and the unfreeze of a thawed week", () => {
    const events = buildActivityEvents(
      source({
        frozenWeek: {
          weekTotal: 40,
          objective: 40,
          isDeleted: true,
          createdAt: at("2026-10-23T20:00:00Z"),
          updatedAt: at("2026-10-26T13:00:00Z"),
        },
      }),
    );
    expect(kinds(events)).toEqual(["weekUnfrozen", "weekFrozen"]);
  });

  it("logs the saved objectives, with kilometrage when there is some", () => {
    const objective = { objective: 38, updatedAt: at("2026-10-26T12:00:00Z") };
    const withoutKm = buildActivityEvents(source({ objective }));
    const withKm = buildActivityEvents(source({ objective, kilometrage: 120 }));
    expect(activityDetail(withoutKm[0])).toBe("38h");
    expect(activityDetail(withKm[0])).toBe("38h · 120 km");
  });

  it("sorts everything newest first", () => {
    const events = buildActivityEvents(
      source({
        entries: [entry({ id: 1 }), punch({ id: 2 })],
        objective: { objective: 40, updatedAt: at("2026-10-27T20:00:00Z") },
      }),
    );
    expect(kinds(events)).toEqual([
      "objectivesSaved",
      "punchEnded",
      "manualAdded",
      "punchStarted",
    ]);
  });
});

describe("activityDetail", () => {
  it("joins the names, the duration and the note", () => {
    expect(
      activityDetail({
        id: "x",
        kind: "manualAdded",
        at: at("2026-10-27T14:00:00Z"),
        names: ["Gagné", "Fabrication"],
        hours: 1.5,
        note: null,
      }),
    ).toBe("Gagné, Fabrication · 01h 30m");
  });

  it("is empty when the event has nothing to add", () => {
    expect(
      activityDetail({
        id: "x",
        kind: "weekUnfrozen",
        at: at("2026-10-27T14:00:00Z"),
        names: [],
        hours: null,
        note: null,
      }),
    ).toBe("");
  });
});

describe("groupActivityByDay", () => {
  it("groups by local day, so late evenings stay on their own day", () => {
    const created = (id: number, iso: string) =>
      entry({ id, createdAt: at(iso), updatedAt: at(iso) });
    const events = buildActivityEvents(
      source({
        entries: [
          created(1, "2026-10-28T03:30:00Z"),
          created(2, "2026-10-27T14:00:00Z"),
          created(3, "2026-10-28T14:00:00Z"),
        ],
      }),
    );
    expect(
      groupActivityByDay(events).map(({ dayKey, events }) => [
        dayKey,
        events.length,
      ]),
    ).toEqual([
      ["2026-10-28", 1],
      ["2026-10-27", 2],
    ]);
  });
});

describe("formatting", () => {
  it("shows the time in the shop's time zone", () => {
    expect(formatActivityTime(at("2026-10-27T12:02:00Z"))).toBe("08 h 02");
  });

  it("labels a day with its weekday", () => {
    expect(activityDayLabel("2026-10-27")).toBe("mardi 27 octobre");
  });
});
