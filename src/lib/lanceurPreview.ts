import type { CSSProperties } from "react";

import { DAYS_PER_WEEK } from "@/constants/calendar";
import { LANCEUR_FALLBACK_COLOR, LANCEUR_LOCALE } from "@/constants/lanceur";
import { GANTT_NO_INDEX } from "@/constants/lanceurGantt";
import type { PlanLoadLevel } from "@/constants/lanceurPlan";
import {
  LANCEUR_PREVIEW_COLUMN_VAR,
  LANCEUR_PREVIEW_COLUMNS_VAR,
  LANCEUR_PREVIEW_LABEL_SEPARATOR,
  LANCEUR_PREVIEW_MONTH_OPTIONS,
  LANCEUR_PREVIEW_PART_SEPARATOR,
  LANCEUR_PREVIEW_PLANNING_LABEL,
  LANCEUR_PREVIEW_POINTS_DECIMALS,
  LANCEUR_PREVIEW_POINTS_SUFFIX,
  LANCEUR_PREVIEW_PRODUCTION_LABEL,
  LANCEUR_PREVIEW_RANGE_SEPARATOR,
  LANCEUR_PREVIEW_TODAY_VAR,
  LANCEUR_PREVIEW_WEEKS,
} from "@/constants/lanceurPreview";
import {
  addDays,
  formatDayMonth,
  mondayOf,
  type DateKey,
} from "@/lib/calendar";
import {
  buildDayIndex,
  dayIndexOf,
  monthSpans,
  weekSpans,
  workingDays,
} from "@/lib/lanceurGantt";
import {
  loadByDay,
  loadLevel,
  weekPoints,
  type PlanItem,
  type PlanSettings,
} from "@/lib/lanceurPlan";
import { projectColorStyle } from "@/lib/projects";

const previewMonthFormatter = new Intl.DateTimeFormat(
  LANCEUR_LOCALE,
  LANCEUR_PREVIEW_MONTH_OPTIONS,
);

export type PreviewSpan = { start: number; count: number };

export type PreviewDateRange = { from: DateKey; to: DateKey };

export type LanceurPreviewMonth = PreviewSpan & { key: string; label: string };

export type LanceurPreviewWeek = PreviewSpan & {
  weekStart: DateKey;
  points: number;
  level: PlanLoadLevel;
};

export type LanceurPreviewRow = {
  id: number;
  label: string;
  color: string;
  planning: PreviewDateRange | null;
  production: PreviewDateRange | null;
  planningSpan: PreviewSpan | null;
  productionSpan: PreviewSpan | null;
};

export type LanceurPreview = {
  dayCount: number;
  todayIndex: number;
  months: LanceurPreviewMonth[];
  weeks: LanceurPreviewWeek[];
  rows: LanceurPreviewRow[];
};

export function previewSpan(
  days: readonly DateKey[],
  index: ReadonlyMap<DateKey, number>,
  range: PreviewDateRange | null,
): PreviewSpan | null {
  const first = days[0];
  const last = days[days.length - 1];
  if (!range || !first || range.to < range.from) {
    return null;
  }
  if (range.to < first || range.from > last) {
    return null;
  }
  const start = range.from <= first ? 0 : dayIndexOf(index, range.from);
  const end = range.to >= last ? days.length - 1 : dayIndexOf(index, range.to);
  if (start === GANTT_NO_INDEX || end === GANTT_NO_INDEX || end < start) {
    return null;
  }
  return { start, count: end - start + 1 };
}

function planningRange(item: PlanItem): PreviewDateRange | null {
  return item.pdmDate && item.approvalDate
    ? { from: item.pdmDate, to: item.approvalDate }
    : null;
}

function productionRange(item: PlanItem): PreviewDateRange | null {
  return item.approvalDate &&
    item.deliveryDate &&
    item.deliveryDate > item.approvalDate
    ? { from: addDays(item.approvalDate, 1), to: item.deliveryDate }
    : null;
}

function rowStart(row: LanceurPreviewRow): number {
  return (row.planningSpan ?? row.productionSpan)?.start ?? 0;
}

export function buildLanceurPreview(
  items: readonly PlanItem[],
  settings: PlanSettings,
  today: DateKey,
): LanceurPreview {
  const days = workingDays(
    mondayOf(today),
    LANCEUR_PREVIEW_WEEKS * DAYS_PER_WEEK,
  );
  const index = buildDayIndex(days);
  const byDay = loadByDay(items, new Set(settings.closures));

  let monthStart = 0;
  const months = monthSpans(days, previewMonthFormatter).map((month) => {
    const span = { ...month, start: monthStart };
    monthStart += month.count;
    return span;
  });

  const weeks = weekSpans(days).map(({ weekStart, start, count }) => {
    const points = weekPoints(byDay, weekStart, settings.capacityRatio);
    return { weekStart, start, count, points, level: loadLevel(points) };
  });

  const rows = items
    .map((item): LanceurPreviewRow => {
      const planning = planningRange(item);
      const production = productionRange(item);
      return {
        id: item.id,
        label: item.label,
        color: item.color ?? LANCEUR_FALLBACK_COLOR,
        planning,
        production,
        planningSpan: previewSpan(days, index, planning),
        productionSpan: previewSpan(days, index, production),
      };
    })
    .filter((row) => row.planningSpan || row.productionSpan)
    .toSorted(
      (a, b) =>
        rowStart(a) - rowStart(b) ||
        a.label.localeCompare(b.label, LANCEUR_LOCALE),
    );

  return {
    dayCount: days.length,
    todayIndex: dayIndexOf(index, today),
    months,
    weeks,
    rows,
  };
}

function formatRange(range: PreviewDateRange): string {
  return `${formatDayMonth(range.from)}${LANCEUR_PREVIEW_RANGE_SEPARATOR}${formatDayMonth(range.to)}`;
}

export function previewRowDescription(row: LanceurPreviewRow): string {
  const parts = [
    row.planning &&
      `${LANCEUR_PREVIEW_PLANNING_LABEL} ${formatRange(row.planning)}`,
    row.production &&
      `${LANCEUR_PREVIEW_PRODUCTION_LABEL} ${formatRange(row.production)}`,
  ].filter((part): part is string => !!part);
  return `${row.label}${LANCEUR_PREVIEW_LABEL_SEPARATOR}${parts.join(LANCEUR_PREVIEW_PART_SEPARATOR)}`;
}

export function formatPreviewPoints(points: number): string {
  return `${points.toFixed(LANCEUR_PREVIEW_POINTS_DECIMALS)}${LANCEUR_PREVIEW_POINTS_SUFFIX}`;
}

export function previewGridStyle(
  preview: Pick<LanceurPreview, "dayCount" | "todayIndex">,
): CSSProperties {
  return {
    [LANCEUR_PREVIEW_COLUMNS_VAR]: `repeat(${preview.dayCount}, minmax(0, 1fr))`,
    [LANCEUR_PREVIEW_TODAY_VAR]: `${preview.todayIndex + 1} / span 1`,
  } as CSSProperties;
}

export function previewSpanStyle(
  span: PreviewSpan,
  color?: string,
): CSSProperties {
  return {
    ...(color ? projectColorStyle(color) : {}),
    [LANCEUR_PREVIEW_COLUMN_VAR]: `${span.start + 1} / span ${span.count}`,
  } as CSSProperties;
}
