import {
  GANTT_BAND_TYPES,
  GANTT_DRAG_MODES,
  GANTT_EXTEND_MONTHS,
  GANTT_INITIAL_MONTHS_AFTER,
  GANTT_INITIAL_MONTHS_BEFORE,
  GANTT_SIDES,
  GANTT_TARGET_MARGIN_MONTHS,
  type GanttSide,
  GANTT_MONTH_OPTIONS,
  GANTT_NO_INDEX,
  GANTT_WEEKDAY_SEARCH_DAYS,
  type GanttDragMode,
} from "@/constants/lanceurGantt";
import { LANCEUR_LOCALE } from "@/constants/lanceur";
import {
  addDays,
  daysBetween,
  isWeekend,
  mondayOf,
  toDateKey,
  type DateKey,
} from "@/lib/calendar";
import type { PlanDates } from "@/lib/lanceurEdit";

const YEAR_END = 4;
const MONTH_START = 5;
const MONTH_END = 7;

const monthFormatter = new Intl.DateTimeFormat(
  LANCEUR_LOCALE,
  GANTT_MONTH_OPTIONS,
);

export type GanttSpan = { key: string; label: string; count: number };

export type GanttWeekSpan = {
  weekStart: DateKey;
  start: number;
  count: number;
};

export type GanttIndexes = { pdm: number; approval: number; delivery: number };

export type GanttBandType =
  (typeof GANTT_BAND_TYPES)[keyof typeof GANTT_BAND_TYPES];

function monthKey(date: DateKey): string {
  return date.slice(0, MONTH_END);
}

function firstOfMonth(year: number, monthIndex: number): DateKey {
  return toDateKey(new Date(Date.UTC(year, monthIndex, 1)));
}

function yearOf(date: DateKey): number {
  return Number(date.slice(0, YEAR_END));
}

function monthIndexOf(date: DateKey): number {
  return Number(date.slice(MONTH_START, MONTH_END)) - 1;
}

export function shiftViewStart(viewStart: DateKey, months: number): DateKey {
  return firstOfMonth(yearOf(viewStart), monthIndexOf(viewStart) + months);
}

export type GanttRange = { start: DateKey; months: number };

export function initialRange(today: DateKey): GanttRange {
  return {
    start: shiftViewStart(today, -GANTT_INITIAL_MONTHS_BEFORE),
    months: GANTT_INITIAL_MONTHS_BEFORE + GANTT_INITIAL_MONTHS_AFTER,
  };
}

export function rangeEnd(range: GanttRange): DateKey {
  return shiftViewStart(range.start, range.months);
}

export function rangeDays(range: GanttRange): DateKey[] {
  return workingDays(range.start, daysBetween(range.start, rangeEnd(range)));
}

export function extendRange(range: GanttRange, side: GanttSide): GanttRange {
  return side === GANTT_SIDES.past
    ? {
        start: shiftViewStart(range.start, -GANTT_EXTEND_MONTHS),
        months: range.months + GANTT_EXTEND_MONTHS,
      }
    : { start: range.start, months: range.months + GANTT_EXTEND_MONTHS };
}

export function rangeIncluding(range: GanttRange, target: DateKey): GanttRange {
  let next = range;
  const lowest = shiftViewStart(target, -GANTT_TARGET_MARGIN_MONTHS);
  const highest = shiftViewStart(target, GANTT_TARGET_MARGIN_MONTHS);
  while (lowest < next.start) {
    next = extendRange(next, GANTT_SIDES.past);
  }
  while (highest > rangeEnd(next)) {
    next = extendRange(next, GANTT_SIDES.future);
  }
  return next;
}

export function workingDays(start: DateKey, count: number): DateKey[] {
  const days: DateKey[] = [];
  for (let offset = 0; offset < count; offset += 1) {
    const day = addDays(start, offset);
    if (!isWeekend(day)) {
      days.push(day);
    }
  }
  return days;
}

export function monthSpans(days: readonly DateKey[]): GanttSpan[] {
  const spans: GanttSpan[] = [];
  for (const day of days) {
    const key = monthKey(day);
    const last = spans[spans.length - 1];
    if (last && last.key === key) {
      last.count += 1;
    } else {
      spans.push({
        key,
        label: monthFormatter.format(new Date(`${day}T00:00:00Z`)),
        count: 1,
      });
    }
  }
  return spans;
}

export function weekSpans(days: readonly DateKey[]): GanttWeekSpan[] {
  const spans: GanttWeekSpan[] = [];
  days.forEach((day, index) => {
    const weekStart = mondayOf(day);
    const last = spans[spans.length - 1];
    if (last && last.weekStart === weekStart) {
      last.count += 1;
    } else {
      spans.push({ weekStart, start: index, count: 1 });
    }
  });
  return spans;
}

export function buildDayIndex(days: readonly DateKey[]): Map<DateKey, number> {
  return new Map(days.map((day, index) => [day, index]));
}

export function dayIndexOf(
  index: ReadonlyMap<DateKey, number>,
  date: DateKey | null,
): number {
  if (!date) {
    return GANTT_NO_INDEX;
  }
  const direct = index.get(date);
  if (direct !== undefined) {
    return direct;
  }
  let day = date;
  for (let step = 0; step < GANTT_WEEKDAY_SEARCH_DAYS; step += 1) {
    day = addDays(day, 1);
    const found = index.get(day);
    if (found !== undefined) {
      return found;
    }
  }
  return GANTT_NO_INDEX;
}

export function ganttIndexes(
  dates: PlanDates,
  index: ReadonlyMap<DateKey, number>,
): GanttIndexes {
  return {
    pdm: dayIndexOf(index, dates.pdmDate),
    approval: dayIndexOf(index, dates.approvalDate),
    delivery: dayIndexOf(index, dates.deliveryDate),
  };
}

export function computeGanttPreview(
  origin: GanttIndexes,
  type: GanttBandType,
  mode: GanttDragMode,
  delta: number,
  count: number,
): GanttIndexes | null {
  const outside = (value: number) => value < 0 || value >= count;
  let { pdm, approval, delivery } = origin;

  if (mode === GANTT_DRAG_MODES.move) {
    const shift = (value: number) =>
      value === GANTT_NO_INDEX ? GANTT_NO_INDEX : value + delta;
    const shifted = {
      pdm: shift(pdm),
      approval: shift(approval),
      delivery: shift(delivery),
    };
    const invalid =
      (pdm !== GANTT_NO_INDEX && outside(shifted.pdm)) ||
      (approval !== GANTT_NO_INDEX && outside(shifted.approval)) ||
      (delivery !== GANTT_NO_INDEX && outside(shifted.delivery));
    return invalid ? null : shifted;
  }

  const isPlanning = type === GANTT_BAND_TYPES.planning;
  if (mode === GANTT_DRAG_MODES.left) {
    if (isPlanning) {
      const next = origin.pdm + delta;
      if (outside(next) || next >= approval) return null;
      pdm = next;
    } else {
      const next = origin.approval + delta;
      if (
        outside(next) ||
        (pdm !== GANTT_NO_INDEX && next <= pdm) ||
        (delivery !== GANTT_NO_INDEX && next >= delivery)
      ) {
        return null;
      }
      approval = next;
    }
  } else if (isPlanning) {
    const next = origin.approval + delta;
    if (
      outside(next) ||
      (pdm !== GANTT_NO_INDEX && next <= pdm) ||
      (delivery !== GANTT_NO_INDEX && next >= delivery)
    ) {
      return null;
    }
    approval = next;
  } else {
    const next = origin.delivery + delta;
    if (outside(next) || next <= approval) return null;
    delivery = next;
  }
  return { pdm, approval, delivery };
}

export function indexesToDates(
  days: readonly DateKey[],
  indexes: GanttIndexes,
  origin: PlanDates,
): PlanDates {
  const pick = (value: number, fallback: DateKey | null) =>
    value === GANTT_NO_INDEX ? fallback : days[value];
  return {
    pdmDate: pick(indexes.pdm, origin.pdmDate),
    approvalDate: pick(indexes.approval, origin.approvalDate),
    deliveryDate: pick(indexes.delivery, origin.deliveryDate),
  };
}
