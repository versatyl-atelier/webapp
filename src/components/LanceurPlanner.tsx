"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { LanceurProjectDialog } from "@/components/LanceurProjectDialog";
import {
  LanceurSettingsDialog,
  type ClosureRecord,
} from "@/components/LanceurSettingsDialog";
import {
  LanceurGantt,
  type GanttScrollRequest,
} from "@/components/LanceurGantt";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ActionTooltip } from "@/components/ActionTooltip";
import { Button } from "@/components/ui/button";
import { SAVE_LABEL } from "@/constants/projects";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EDIT_BUTTON_LABEL,
  EDIT_CANCELLED_MESSAGE,
  EDIT_CANCEL_KEEP_LABEL,
  EDIT_CANCEL_LABEL,
  EDIT_CANCEL_TITLE,
  EDIT_NO_CHANGE_CANCELLED_MESSAGE,
  EDIT_NO_CHANGE_SAVED_MESSAGE,
  EDIT_SESSION_STORAGE_KEY,
  EDIT_STARTED_MESSAGE,
  editCancelDescription,
  editSavedMessage,
} from "@/constants/lanceurEdit";
import {
  GANTT_DEFAULT_DAY_WIDTH,
  GANTT_JUMP_LABEL,
  GANTT_NEXT_LABEL,
  GANTT_PREVIOUS_LABEL,
  type GanttSide,
  GANTT_ZOOM_LABEL,
  GANTT_ZOOM_OPTIONS,
} from "@/constants/lanceurGantt";
import {
  PLAN_AMOUNT_LABEL,
  PLAN_AVAILABILITY_HORIZON_WEEKS,
  PLAN_AVAILABLE_FROM_LABEL,
  PLAN_DEFAULT_AVAILABILITY_AMOUNT,
  PLAN_DELIVERY_LABEL,
  PLAN_LEGEND_CAPACITY,
  PLAN_LEGEND_PLANNING,
  PLAN_LEGEND_PRODUCTION,
  PLAN_LEGEND_SWATCH_LEVELS,
  PLAN_LOAD_CLASSES,
  PLAN_NO_AVAILABILITY_PREFIX,
  PLAN_NO_AVAILABILITY_UNIT,
  PLAN_TODAY_LABEL,
  PLAN_WEEKS_PER_YEAR,
} from "@/constants/lanceurPlan";
import { useLanceurRows } from "@/hooks/use-lanceur-rows";
import type { DateKey } from "@/lib/calendar";
import {
  extendRange,
  initialRange,
  rangeDays,
  rangeIncluding,
} from "@/lib/lanceurGantt";
import {
  toPlanItem,
  type LanceurEmployee,
  type LanceurRow,
} from "@/lib/lanceur";
import {
  computeEditChanges,
  snapshotRows,
  type EditSession,
  type PlanDates,
} from "@/lib/lanceurEdit";
import {
  buildAvailabilityWeeks,
  findFirstAvailability,
  formatPlanDate,
  type PlanSettings,
} from "@/lib/lanceurPlan";
import { cn } from "@/lib/utils";
import type { LanceurPatch } from "@/schemas/lanceur.schemas";

const SEPARATOR_CLASS = "bg-border mx-1 h-5 w-px";
const SWATCH_CLASS = "h-2.5 w-3.5 shrink-0 rounded-xs";

type LanceurPlannerProps = {
  rows: LanceurRow[];
  settings: PlanSettings;
  today: DateKey;
  closures: ClosureRecord[] | null;
  etapes: string[];
  installateurs: string[];
  employees: LanceurEmployee[];
};

function availabilityText(
  amount: number,
  weeks: ReturnType<typeof buildAvailabilityWeeks>,
  settings: PlanSettings,
): string {
  if (!(amount > 0)) {
    return "";
  }
  const result = findFirstAvailability(amount, weeks, settings);
  if (!result) {
    return `${PLAN_NO_AVAILABILITY_PREFIX} ${PLAN_AVAILABILITY_HORIZON_WEEKS / PLAN_WEEKS_PER_YEAR} ${PLAN_NO_AVAILABILITY_UNIT}`;
  }
  return `${PLAN_AVAILABLE_FROM_LABEL} ${formatPlanDate(result.start)} → ${PLAN_DELIVERY_LABEL}${formatPlanDate(result.end)}`;
}

function readStoredSession(): EditSession | null {
  try {
    const stored = window.localStorage.getItem(EDIT_SESSION_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as EditSession) : null;
  } catch {
    return null;
  }
}

function storeSession(session: EditSession | null) {
  if (session) {
    window.localStorage.setItem(
      EDIT_SESSION_STORAGE_KEY,
      JSON.stringify(session),
    );
  } else {
    window.localStorage.removeItem(EDIT_SESSION_STORAGE_KEY);
  }
}

export function LanceurPlanner({
  rows,
  settings,
  today,
  closures,
  etapes,
  installateurs,
  employees,
}: LanceurPlannerProps) {
  const { rows: currentRows, save, saveMany, remove } = useLanceurRows(rows);
  const [dialogPhaseId, setDialogPhaseId] = useState<number | null>(null);
  const items = useMemo(() => currentRows.map(toPlanItem), [currentRows]);
  const dialogRow =
    currentRows.find(({ phaseId }) => phaseId === dialogPhaseId) ?? null;
  const [dayWidth, setDayWidth] = useState(GANTT_DEFAULT_DAY_WIDTH);
  const [range, setRange] = useState(() => initialRange(today));
  const [scrollRequest, setScrollRequest] = useState<GanttScrollRequest | null>(
    { id: 1, target: today },
  );
  const [amountText, setAmountText] = useState(
    String(PLAN_DEFAULT_AVAILABILITY_AMOUNT),
  );
  const [session, setSession] = useState<EditSession | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  useEffect(() => {
    setSession(readStoredSession());
  }, []);

  const weeks = useMemo(
    () => buildAvailabilityWeeks(items, settings, today),
    [items, settings, today],
  );
  const availability = useMemo(
    () => availabilityText(Number(amountText), weeks, settings),
    [amountText, weeks, settings],
  );
  const days = useMemo(() => rangeDays(range), [range]);
  const changes = useMemo(
    () => (session ? computeEditChanges(session.snapshot, currentRows) : []),
    [session, currentRows],
  );

  const updateSession = useCallback((next: EditSession | null) => {
    storeSession(next);
    setSession(next);
  }, []);

  const handleDatesChange = useCallback(
    (itemId: number, patch: Partial<PlanDates>) => save(itemId, patch),
    [save],
  );

  function requestScroll(request: { target?: DateKey; months?: number }) {
    setScrollRequest((current) => ({
      id: (current?.id ?? 0) + 1,
      ...request,
    }));
  }

  function goToDate(date: DateKey) {
    setRange((current) => rangeIncluding(current, date));
    requestScroll({ target: date });
  }

  function goToToday() {
    goToDate(today);
  }

  function jumpTo(date: DateKey) {
    if (date) {
      goToDate(date);
    }
  }

  const handleExtend = useCallback((side: GanttSide) => {
    setRange((current) => extendRange(current, side));
  }, []);

  function startEdit() {
    updateSession({
      startedAt: new Date().toISOString(),
      snapshot: snapshotRows(currentRows),
    });
    toast(EDIT_STARTED_MESSAGE);
  }

  function saveEdit() {
    if (changes.length === 0) {
      updateSession(null);
      toast(EDIT_NO_CHANGE_SAVED_MESSAGE);
      return;
    }
    updateSession(null);
    toast.success(editSavedMessage(changes.length));
  }

  function requestCancel() {
    if (changes.length === 0) {
      updateSession(null);
      toast(EDIT_NO_CHANGE_CANCELLED_MESSAGE);
      return;
    }
    setConfirmingCancel(true);
  }

  function confirmCancel() {
    if (!session) {
      return;
    }
    const changed = new Set(changes.map(({ phaseId }) => phaseId));
    const updates = session.snapshot
      .filter(({ phaseId }) => changed.has(phaseId))
      .map(
        ({
          phaseId,
          price,
          pdmDate,
          approvalDate,
          deliveryDate,
          approvedOverride,
        }) => ({
          phaseId,
          patch: {
            price,
            pdmDate,
            approvalDate,
            deliveryDate,
            approvedOverride,
          } satisfies LanceurPatch,
        }),
      );
    setConfirmingCancel(false);
    saveMany(updates, () => {
      updateSession(null);
      toast(EDIT_CANCELLED_MESSAGE);
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col print:block">
      <div className="bg-card flex shrink-0 flex-wrap items-center gap-2 border-b px-4 py-1.5 print:hidden">
        <Button type="button" size="sm" onClick={goToToday}>
          {PLAN_TODAY_LABEL}
        </Button>
        <ActionTooltip
          label={GANTT_PREVIOUS_LABEL}
          render={
            <Button
              type="button"
              size="sm"
              variant="outline"
              aria-label={GANTT_PREVIOUS_LABEL}
              onClick={() => requestScroll({ months: -1 })}
            />
          }
        >
          ◀
        </ActionTooltip>
        <ActionTooltip
          label={GANTT_NEXT_LABEL}
          render={
            <Button
              type="button"
              size="sm"
              variant="outline"
              aria-label={GANTT_NEXT_LABEL}
              onClick={() => requestScroll({ months: 1 })}
            />
          }
        >
          ▶
        </ActionTooltip>
        <div className={SEPARATOR_CLASS} />
        <label htmlFor="lanceur-jump" className="text-muted-foreground text-xs">
          {GANTT_JUMP_LABEL}
        </label>
        <Input
          id="lanceur-jump"
          type="date"
          onChange={(event) => jumpTo(event.target.value)}
          className="h-7 w-36 px-1.5 text-xs md:text-xs"
        />
        <div className={SEPARATOR_CLASS} />
        <label className="text-muted-foreground text-xs">
          {GANTT_ZOOM_LABEL}
        </label>
        <Select
          items={GANTT_ZOOM_OPTIONS}
          value={String(dayWidth)}
          onValueChange={(value) => {
            if (value !== null) {
              setDayWidth(Number(value));
            }
          }}
        >
          <SelectTrigger
            aria-label={GANTT_ZOOM_LABEL}
            size="sm"
            className="w-36"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GANTT_ZOOM_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className={SEPARATOR_CLASS} />
        {session ? (
          <>
            <Button type="button" size="sm" onClick={saveEdit}>
              {SAVE_LABEL}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-destructive"
              onClick={requestCancel}
            >
              {EDIT_CANCEL_LABEL}
            </Button>
          </>
        ) : (
          <Button type="button" size="sm" onClick={startEdit}>
            {EDIT_BUTTON_LABEL}
          </Button>
        )}
        {closures && (
          <LanceurSettingsDialog settings={settings} closures={closures} />
        )}
        <label
          htmlFor="lanceur-amount"
          className="text-muted-foreground text-2xs ml-auto"
        >
          {PLAN_AMOUNT_LABEL}
        </label>
        <Input
          id="lanceur-amount"
          type="number"
          min={0}
          step={1000}
          value={amountText}
          onChange={(event) => setAmountText(event.target.value)}
          className="h-7 w-24 px-1.5 text-right text-xs md:text-xs"
        />
        <span className="text-muted-foreground text-2xs">{availability}</span>
      </div>
      <LanceurGantt
        items={items}
        settings={settings}
        today={today}
        days={days}
        dayWidth={dayWidth}
        editable={session !== null}
        scrollRequest={scrollRequest}
        onDatesChange={handleDatesChange}
        onExtend={handleExtend}
        onOpenProject={setDialogPhaseId}
      />
      {dialogRow && (
        <LanceurProjectDialog
          key={dialogRow.phaseId}
          row={dialogRow}
          etapes={etapes}
          installateurs={installateurs}
          employees={employees}
          onClose={() => setDialogPhaseId(null)}
          onSave={(patch) => save(dialogRow.phaseId, patch)}
          onRemove={() => remove(dialogRow.phaseId)}
        />
      )}
      <div className="bg-card text-muted-foreground flex shrink-0 flex-wrap items-center gap-4 border-t px-4 py-1.5 text-xs print:hidden">
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={cn(
              SWATCH_CLASS,
              "bg-primary/15 border-primary/55 border border-dashed",
            )}
          />
          {PLAN_LEGEND_PLANNING}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={cn(
              SWATCH_CLASS,
              "bg-primary/40 border-primary/75 border",
            )}
          />
          {PLAN_LEGEND_PRODUCTION}
        </span>
        <div className={SEPARATOR_CLASS} />
        <span className="flex items-center gap-1.5">
          {PLAN_LEGEND_CAPACITY} :
          {PLAN_LEGEND_SWATCH_LEVELS.map((level) => (
            <span
              key={level}
              aria-hidden
              className={cn(SWATCH_CLASS, PLAN_LOAD_CLASSES[level])}
            />
          ))}
        </span>
      </div>
      <AlertDialog open={confirmingCancel} onOpenChange={setConfirmingCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{EDIT_CANCEL_TITLE}</AlertDialogTitle>
            <AlertDialogDescription>
              {editCancelDescription(changes.length)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{EDIT_CANCEL_KEEP_LABEL}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>
              {EDIT_CANCEL_LABEL}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
