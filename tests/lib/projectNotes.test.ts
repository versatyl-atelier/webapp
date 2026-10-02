import { describe, expect, it } from "vitest";

import {
  JUST_NOW_LABEL,
  NOTE_AUTHOR_COLOR_CLASSES,
  UNKNOWN_AUTHOR_COLOR_CLASS,
  UNKNOWN_AUTHOR_INITIALS,
} from "@/constants/projects";
import {
  activeNoteCount,
  authorColorClass,
  authorInitials,
  currentVersion,
  formatNoteTime,
  noteCountLabel,
  noteSections,
  previousVersions,
  type NoteRecord,
  type NoteVersionRecord,
} from "@/lib/projectNotes";

const version = (id: number, body: string): NoteVersionRecord => ({
  id,
  body,
  stage: null,
  createdAt: new Date("2026-08-10T12:00:00Z"),
  author: { id: "u1", name: "Sophie Tremblay" },
});

const note = (overrides: Partial<NoteRecord>): NoteRecord => ({
  id: 1,
  phaseId: null,
  isDeleted: false,
  versions: [version(1, "Première")],
  ...overrides,
});

describe("noteSections", () => {
  it("always starts with the general section, then one section per phase", () => {
    const phases = [
      { id: 10, name: "Phase 1" },
      { id: 20, name: "Phase 2" },
    ];
    const notes = [
      note({ id: 1, phaseId: 20 }),
      note({ id: 2, phaseId: null }),
      note({ id: 3, phaseId: 10 }),
    ];
    expect(
      noteSections(phases, notes).map(({ phase, notes }) => [
        phase?.id ?? null,
        notes.map(({ id }) => id),
      ]),
    ).toEqual([
      [null, [2]],
      [10, [3]],
      [20, [1]],
    ]);
  });

  it("only has the general section when the project has no phases", () => {
    expect(noteSections([], [note({})])).toEqual([
      { phase: null, notes: [note({})] },
    ]);
  });
});

describe("currentVersion / previousVersions", () => {
  it("shows the latest version and lists older ones newest first", () => {
    const edited = note({
      versions: [version(1, "a"), version(2, "b"), version(3, "c")],
    });
    expect(currentVersion(edited).body).toBe("c");
    expect(previousVersions(edited).map(({ body }) => body)).toEqual([
      "b",
      "a",
    ]);
  });
});

describe("activeNoteCount / noteCountLabel", () => {
  it("ignores deleted notes and pluralizes after one", () => {
    const notes = [note({ id: 1 }), note({ id: 2, isDeleted: true })];
    expect(activeNoteCount(notes)).toBe(1);
    expect(noteCountLabel(0)).toBe("0 note");
    expect(noteCountLabel(1)).toBe("1 note");
    expect(noteCountLabel(2)).toBe("2 notes");
  });
});

describe("authorInitials", () => {
  it("uses the first letters of the first two words", () => {
    expect(authorInitials({ id: "u1", name: "martin jean-luc roy" })).toBe(
      "MJ",
    );
  });

  it("falls back when the author is unknown", () => {
    expect(authorInitials(null)).toBe(UNKNOWN_AUTHOR_INITIALS);
    expect(authorInitials({ id: "u1", name: " " })).toBe(
      UNKNOWN_AUTHOR_INITIALS,
    );
  });
});

describe("authorColorClass", () => {
  it("gives each author a stable palette color", () => {
    const author = { id: "abc123", name: "Sophie" };
    expect(NOTE_AUTHOR_COLOR_CLASSES).toContain(authorColorClass(author));
    expect(authorColorClass(author)).toBe(
      authorColorClass({ ...author, name: "Renamed" }),
    );
    expect(authorColorClass(null)).toBe(UNKNOWN_AUTHOR_COLOR_CLASS);
  });
});

describe("formatNoteTime", () => {
  const now = new Date("2026-08-10T20:20:00Z");

  it("is relative within the last day", () => {
    expect(formatNoteTime(new Date("2026-08-10T20:19:40Z"), now)).toBe(
      JUST_NOW_LABEL,
    );
    expect(formatNoteTime(new Date("2026-08-10T20:05:00Z"), now)).toBe(
      "il y a 15\u00a0min",
    );
    expect(formatNoteTime(new Date("2026-08-10T17:20:00Z"), now)).toBe(
      "il y a 3\u00a0h",
    );
  });

  it("shows the local date and time after a day", () => {
    expect(formatNoteTime(new Date("2026-08-06T14:05:00Z"), now)).toBe(
      "6 août, 10 h 05",
    );
  });
});
