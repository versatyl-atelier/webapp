"use client";

import {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  GANTT_BAND_HELP,
  GANTT_BAND_TYPES,
  GANTT_CAPACITY_TITLE,
  GANTT_DAY_ABBREVIATIONS,
  GANTT_DRAG_MODES,
  GANTT_EDGE_SCROLL_STEP_PX,
  GANTT_EDGE_SCROLL_ZONE_PX,
  GANTT_EDIT_HINT,
  GANTT_EXTEND_EDGE_PX,
  GANTT_SIDES,
  GANTT_WORKDAYS_PER_MONTH,
  GANTT_MARK_CLASSES,
  GANTT_MARK_LABELS,
  GANTT_NO_INDEX,
  GANTT_PROJECTS_HEADER,
  GANTT_PROJECT_COLUMN,
  GANTT_SCROLL_MARGIN_PX,
  type GanttDragMode,
  type GanttSide,
} from "@/constants/lanceurGantt";
import { PLAN_CLOSURE_LABEL, PLAN_LOAD_CLASSES } from "@/constants/lanceurPlan";
import {
  LANCEUR_FALLBACK_COLOR,
  LANCEUR_NO_VALUE_LABEL,
  LANCEUR_TABLE_EMPTY_LABEL,
} from "@/constants/lanceur";
import type { LanceurDateKind } from "@/constants/lanceurCalendar";
import { weekdayOf, type DateKey } from "@/lib/calendar";
import { changedDates, type PlanDates } from "@/lib/lanceurEdit";
import {
  buildDayIndex,
  computeGanttPreview,
  dayIndexOf,
  ganttIndexes,
  indexesToDates,
  monthSpans,
  weekSpans,
  type GanttBandType,
  type GanttIndexes,
} from "@/lib/lanceurGantt";
import {
  loadByDay,
  loadLevel,
  weekPoints,
  type PlanItem,
  type PlanSettings,
} from "@/lib/lanceurPlan";
import { projectColorStyle } from "@/lib/projects";
import { DIALOG_EDIT_LABEL } from "@/constants/lanceurDialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

const SECTION_HEADER_CLASS =
  "text-muted-foreground bg-sidebar flex h-7.5 shrink-0 items-center border-b px-3 text-3xs font-bold tracking-widest uppercase";
const BAND_BASE_CLASS = "absolute inset-y-0";
const BAND_EDITABLE_CLASS = "cursor-grab active:cursor-grabbing";
const EDGE_CLASS = "absolute inset-y-0 w-1.5 cursor-ew-resize";

type DragState = {
  itemId: number;
  type: GanttBandType;
  mode: GanttDragMode;
  startX: number;
  origin: PlanDates;
  originIndexes: GanttIndexes;
  lastDelta: number;
  preview: PlanDates;
};

export type GanttScrollRequest = {
  id: number;
  target?: DateKey;
  months?: number;
};

type LanceurGanttProps = {
  items: PlanItem[];
  settings: PlanSettings;
  today: DateKey;
  days: DateKey[];
  dayWidth: number;
  editable: boolean;
  scrollRequest: GanttScrollRequest | null;
  onDatesChange: (itemId: number, patch: Partial<PlanDates>) => void;
  onExtend: (side: GanttSide) => void;
  onOpenProject: (itemId: number) => void;
};

function markOf(dates: PlanDates | null, day: DateKey): LanceurDateKind | null {
  if (!dates) return null;
  if (dates.pdmDate === day) return "pdm";
  if (dates.approvalDate === day) return "approval";
  if (dates.deliveryDate === day) return "delivery";
  return null;
}

function bandTitle(item: PlanItem, type: GanttBandType, editable: boolean) {
  const range =
    type === GANTT_BAND_TYPES.planning
      ? `${item.pdmDate} → ${item.approvalDate}`
      : `${item.approvalDate} → ${item.deliveryDate}`;
  const label =
    type === GANTT_BAND_TYPES.planning ? "Planification" : "Production";
  return `${label} ${range} (${editable ? GANTT_BAND_HELP : GANTT_EDIT_HINT})`;
}

export const LanceurGantt = memo(function LanceurGantt({
  items,
  settings,
  today,
  days,
  dayWidth,
  editable,
  scrollRequest,
  onDatesChange,
  onExtend,
  onOpenProject,
}: LanceurGanttProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const firstDayRef = useRef<DateKey | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const displayItems = useMemo(
    () =>
      drag
        ? items.map((item) =>
            item.id === drag.itemId ? { ...item, ...drag.preview } : item,
          )
        : items,
    [items, drag],
  );
  const closures = useMemo(() => new Set(settings.closures), [settings]);
  const index = useMemo(() => buildDayIndex(days), [days]);
  const months = useMemo(() => monthSpans(days), [days]);
  const weeks = useMemo(() => weekSpans(days), [days]);
  const byDay = useMemo(
    () => loadByDay(displayItems, closures),
    [displayItems, closures],
  );
  const selected = displayItems.find((item) => item.id === selectedId) ?? null;
  const totalWidth = days.length * dayWidth;
  const todayIndex = index.get(today);
  const isDragging = drag !== null;

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const previousFirst = firstDayRef.current;
    firstDayRef.current = days[0] ?? null;
    if (!scroller || !previousFirst || !days[0] || days[0] >= previousFirst) {
      return;
    }
    const shift = dayIndexOf(index, previousFirst);
    if (shift > 0) {
      scroller.scrollLeft += shift * dayWidth;
    }
  }, [days, index, dayWidth]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scrollRequest || !scroller) {
      return;
    }
    if (scrollRequest.months !== undefined) {
      scroller.scrollLeft +=
        scrollRequest.months * GANTT_WORKDAYS_PER_MONTH * dayWidth;
      return;
    }
    const target = dayIndexOf(index, scrollRequest.target ?? null);
    if (target !== GANTT_NO_INDEX) {
      scroller.scrollLeft = Math.max(
        0,
        target * dayWidth - GANTT_SCROLL_MARGIN_PX,
      );
    }
  }, [scrollRequest]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }
    function onScroll() {
      if (!scroller) {
        return;
      }
      if (scroller.scrollLeft < GANTT_EXTEND_EDGE_PX) {
        onExtend(GANTT_SIDES.past);
      } else if (
        scroller.scrollLeft + scroller.clientWidth >
        scroller.scrollWidth - GANTT_EXTEND_EDGE_PX
      ) {
        onExtend(GANTT_SIDES.future);
      }
    }
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [onExtend, days]);

  useEffect(() => {
    if (!isDragging) {
      return;
    }
    function finish(commit: boolean) {
      const state = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (!state || !commit) {
        return;
      }
      const patch = changedDates(state.origin, state.preview);
      if (Object.keys(patch).length > 0) {
        onDatesChange(state.itemId, patch);
      }
    }
    function onMove(event: PointerEvent) {
      const state = dragRef.current;
      const scroller = scrollerRef.current;
      if (!state || !scroller) {
        return;
      }
      const delta = Math.round(
        (event.clientX + scroller.scrollLeft - state.startX) / dayWidth,
      );
      const rect = scroller.getBoundingClientRect();
      if (event.clientX < rect.left + GANTT_EDGE_SCROLL_ZONE_PX) {
        scroller.scrollLeft -= GANTT_EDGE_SCROLL_STEP_PX;
      } else if (event.clientX > rect.right - GANTT_EDGE_SCROLL_ZONE_PX) {
        scroller.scrollLeft += GANTT_EDGE_SCROLL_STEP_PX;
      }
      if (delta === state.lastDelta) {
        return;
      }
      const indexes = computeGanttPreview(
        state.originIndexes,
        state.type,
        state.mode,
        delta,
        days.length,
      );
      if (!indexes) {
        return;
      }
      const next = {
        ...state,
        lastDelta: delta,
        preview: indexesToDates(days, indexes, state.origin),
      };
      dragRef.current = next;
      setDrag(next);
    }
    function onUp() {
      finish(true);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        finish(false);
      }
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", onKey);
    };
  }, [isDragging, days, dayWidth, onDatesChange]);

  function startDrag(
    event: React.PointerEvent<HTMLElement>,
    item: PlanItem,
    type: GanttBandType,
  ) {
    const scroller = scrollerRef.current;
    if (!editable || !scroller) {
      return;
    }
    const grip = (event.target as HTMLElement).dataset.edge;
    const mode =
      grip === GANTT_DRAG_MODES.left
        ? GANTT_DRAG_MODES.left
        : grip === GANTT_DRAG_MODES.right
          ? GANTT_DRAG_MODES.right
          : GANTT_DRAG_MODES.move;
    const origin: PlanDates = {
      pdmDate: item.pdmDate,
      approvalDate: item.approvalDate,
      deliveryDate: item.deliveryDate,
    };
    const state: DragState = {
      itemId: item.id,
      type,
      mode,
      startX: event.clientX + scroller.scrollLeft,
      origin,
      originIndexes: ganttIndexes(origin, index),
      lastDelta: 0,
      preview: origin,
    };
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = state;
    setDrag(state);
  }

  function toggleSelected(id: number) {
    setSelectedId((current) => (current === id ? null : id));
  }

  const edges = (type: GanttBandType, item: PlanItem) =>
    editable ? (
      <>
        <span
          data-edge={GANTT_DRAG_MODES.left}
          className={cn(EDGE_CLASS, "left-0")}
          onPointerDown={(event) => startDrag(event, item, type)}
        />
        <span
          data-edge={GANTT_DRAG_MODES.right}
          className={cn(EDGE_CLASS, "right-0")}
          onPointerDown={(event) => startDrag(event, item, type)}
        />
      </>
    ) : null;

  return (
    <div
      ref={scrollerRef}
      className={cn(
        "bg-card relative min-h-0 flex-1 overflow-auto",
        isDragging && "cursor-grabbing select-none",
      )}
    >
      <div className="w-max min-w-full">
        <div className="sticky top-0 z-30 flex">
          <div className="bg-sidebar text-muted-foreground text-3xs sticky left-0 z-40 flex w-65 shrink-0 items-end border-r border-b px-3 py-1.5">
            {GANTT_PROJECT_COLUMN}
          </div>
          <div className="bg-card border-b" style={{ width: totalWidth }}>
            <div className="flex h-5">
              {months.map((month) => (
                <div
                  key={month.key}
                  className="text-muted-foreground text-2xs shrink-0 overflow-hidden border-r px-2 py-0.5 font-semibold whitespace-nowrap capitalize"
                  style={{ width: month.count * dayWidth }}
                >
                  {month.label}
                </div>
              ))}
            </div>
            <div className="flex h-8.5">
              {days.map((day) => {
                const mark = markOf(selected, day);
                const isMonday = weekdayOf(day) === 1;
                return (
                  <div
                    key={day}
                    title={
                      mark
                        ? GANTT_MARK_LABELS[mark]
                        : closures.has(day)
                          ? PLAN_CLOSURE_LABEL
                          : undefined
                    }
                    className={cn(
                      "text-muted-foreground text-3xs shrink-0 border-b-3 border-transparent pt-0.5 text-center",
                      isMonday && "border-l",
                      closures.has(day) && "bg-destructive/15",
                      day === today && "bg-info/15",
                      mark && GANTT_MARK_CLASSES[mark],
                    )}
                    style={{ width: dayWidth }}
                  >
                    <span
                      className={cn(
                        "text-foreground block text-xs leading-tight font-semibold",
                        day === today && "text-info",
                        mark && "text-inherit",
                      )}
                    >
                      {Number(day.slice(8))}
                    </span>
                    {GANTT_DAY_ABBREVIATIONS[weekdayOf(day)]}
                  </div>
                );
              })}
            </div>
            <div className="flex h-4 border-t" title={GANTT_CAPACITY_TITLE}>
              {weeks.map((week) => {
                const points = weekPoints(
                  byDay,
                  week.weekStart,
                  settings.capacityRatio,
                );
                const rounded = Math.round(points);
                return (
                  <div
                    key={week.weekStart}
                    title={`${points.toFixed(1)} pts /10`}
                    className={cn(
                      "text-foreground/55 text-3xs shrink-0 overflow-hidden border-l text-center leading-4 font-semibold",
                      PLAN_LOAD_CLASSES[loadLevel(points)],
                    )}
                    style={{ width: week.count * dayWidth }}
                  >
                    {rounded > 0 ? rounded : ""}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex">
          <div className="bg-sidebar sticky left-0 z-20 w-65 shrink-0 border-r">
            <div className={SECTION_HEADER_CLASS}>{GANTT_PROJECTS_HEADER}</div>
            {items.length === 0 && (
              <p className="text-muted-foreground p-4 text-center text-xs">
                {LANCEUR_TABLE_EMPTY_LABEL}
              </p>
            )}
            {items.map((item) => (
              <div
                key={item.id}
                style={projectColorStyle(item.color ?? LANCEUR_FALLBACK_COLOR)}
                className={cn(
                  "bg-card hover:bg-accent group flex h-7 w-full items-center border-b",
                  item.id === selectedId && "bg-info/10 hover:bg-info/15",
                )}
              >
                <button
                  type="button"
                  aria-pressed={item.id === selectedId}
                  title={item.label}
                  onClick={() => toggleSelected(item.id)}
                  onDoubleClick={() => onOpenProject(item.id)}
                  className="flex h-full min-w-0 flex-1 items-center gap-2 pl-3 text-left text-xs font-medium"
                >
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-xs bg-(--project-color)"
                  />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`${DIALOG_EDIT_LABEL}: ${item.label}`}
                  title={DIALOG_EDIT_LABEL}
                  onClick={() => onOpenProject(item.id)}
                  className="mr-1 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
                >
                  <Pencil />
                </Button>
              </div>
            ))}
          </div>

          <div className="relative shrink-0" style={{ width: totalWidth }}>
            <div className={SECTION_HEADER_CLASS} />
            <div className="relative">
              <div className="pointer-events-none absolute inset-0 z-0">
                {weeks.map((week) => (
                  <div
                    key={week.weekStart}
                    className="absolute inset-y-0 border-l"
                    style={{ left: week.start * dayWidth }}
                  />
                ))}
                {days.map((day, position) =>
                  closures.has(day) ? (
                    <div
                      key={day}
                      className="bg-destructive/15 absolute inset-y-0"
                      style={{ left: position * dayWidth, width: dayWidth }}
                    />
                  ) : null,
                )}
                {todayIndex !== undefined && (
                  <>
                    <div
                      className="bg-info/10 absolute inset-y-0"
                      style={{ left: todayIndex * dayWidth, width: dayWidth }}
                    />
                    <div
                      className="bg-info/45 absolute inset-y-0 z-10 w-0.5"
                      style={{
                        left: todayIndex * dayWidth + Math.floor(dayWidth / 2),
                      }}
                    />
                  </>
                )}
              </div>
              {displayItems.map((item) => {
                const indexes = ganttIndexes(item, index);
                const hasPlanning =
                  indexes.pdm !== GANTT_NO_INDEX &&
                  indexes.approval !== GANTT_NO_INDEX &&
                  indexes.approval >= indexes.pdm;
                const hasProduction =
                  indexes.approval !== GANTT_NO_INDEX &&
                  indexes.delivery !== GANTT_NO_INDEX &&
                  indexes.delivery > indexes.approval;
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelected(item.id)}
                    style={projectColorStyle(
                      item.color ?? LANCEUR_FALLBACK_COLOR,
                    )}
                    className={cn(
                      "relative z-10 h-7 border-b",
                      item.id === selectedId && "bg-info/10",
                    )}
                  >
                    {hasPlanning && (
                      <div
                        title={bandTitle(
                          item,
                          GANTT_BAND_TYPES.planning,
                          editable,
                        )}
                        onPointerDown={(event) =>
                          startDrag(event, item, GANTT_BAND_TYPES.planning)
                        }
                        className={cn(
                          BAND_BASE_CLASS,
                          "bg-(--project-color)/15",
                          editable && BAND_EDITABLE_CLASS,
                        )}
                        style={{
                          left: indexes.pdm * dayWidth,
                          width:
                            (indexes.approval - indexes.pdm + 1) * dayWidth,
                        }}
                      >
                        {edges(GANTT_BAND_TYPES.planning, item)}
                      </div>
                    )}
                    {hasProduction && (
                      <div
                        title={bandTitle(
                          item,
                          GANTT_BAND_TYPES.production,
                          editable,
                        )}
                        onPointerDown={(event) =>
                          startDrag(event, item, GANTT_BAND_TYPES.production)
                        }
                        className={cn(
                          BAND_BASE_CLASS,
                          "bg-(--project-color)/35",
                          editable && BAND_EDITABLE_CLASS,
                        )}
                        style={{
                          left: (indexes.approval + 1) * dayWidth,
                          width:
                            (indexes.delivery - indexes.approval) * dayWidth,
                        }}
                      >
                        {edges(GANTT_BAND_TYPES.production, item)}
                      </div>
                    )}
                    <span className="sr-only">
                      {item.label} {item.pdmDate ?? LANCEUR_NO_VALUE_LABEL}{" "}
                      {item.approvalDate ?? LANCEUR_NO_VALUE_LABEL}{" "}
                      {item.deliveryDate ?? LANCEUR_NO_VALUE_LABEL}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
