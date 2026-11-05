import { EDIT_FIELDS, type EditField } from "@/constants/lanceurEdit";
import { LANCEUR_NO_VALUE_LABEL } from "@/constants/lanceur";
import type { DateKey } from "@/lib/calendar";
import { formatPrice, phaseLabel, type LanceurRow } from "@/lib/lanceur";
import { formatPlanDate } from "@/lib/lanceurPlan";

export type PlanDates = {
  pdmDate: DateKey | null;
  approvalDate: DateKey | null;
  deliveryDate: DateKey | null;
};

export type EditSnapshotEntry = PlanDates & {
  phaseId: number;
  label: string;
  price: number | null;
  approvedOverride: boolean | null;
};

export type EditSession = {
  startedAt: string;
  snapshot: EditSnapshotEntry[];
};

export type EditChange = {
  phaseId: number;
  label: string;
  field: EditField;
  oldValue: string | null;
  newValue: string | null;
};

export function changedDates(
  origin: PlanDates,
  next: PlanDates,
): Partial<PlanDates> {
  const patch: Partial<PlanDates> = {};
  if (origin.pdmDate !== next.pdmDate) patch.pdmDate = next.pdmDate;
  if (origin.approvalDate !== next.approvalDate) {
    patch.approvalDate = next.approvalDate;
  }
  if (origin.deliveryDate !== next.deliveryDate) {
    patch.deliveryDate = next.deliveryDate;
  }
  return patch;
}

export function snapshotRows(rows: readonly LanceurRow[]): EditSnapshotEntry[] {
  return rows.map((row) => ({
    phaseId: row.phaseId,
    label: phaseLabel(row),
    price: row.price,
    pdmDate: row.pdmDate,
    approvalDate: row.approvalDate,
    deliveryDate: row.deliveryDate,
    approvedOverride: row.approvedOverride,
  }));
}

function textOf(value: string | number | null): string | null {
  return value === null ? null : String(value);
}

export function computeEditChanges(
  snapshot: readonly EditSnapshotEntry[],
  rows: readonly LanceurRow[],
): EditChange[] {
  const before = new Map(snapshot.map((entry) => [entry.phaseId, entry]));
  const changes: EditChange[] = [];
  for (const row of rows) {
    const entry = before.get(row.phaseId);
    if (!entry) {
      continue;
    }
    for (const field of EDIT_FIELDS) {
      const oldValue = textOf(entry[field]);
      const newValue = textOf(row[field]);
      if (oldValue !== newValue) {
        changes.push({
          phaseId: row.phaseId,
          label: phaseLabel(row),
          field,
          oldValue,
          newValue,
        });
      }
    }
  }
  return changes;
}

export function formatLogValue(field: EditField, value: string | null): string {
  if (value === null || value === "") {
    return LANCEUR_NO_VALUE_LABEL;
  }
  return field === "price" ? formatPrice(Number(value)) : formatPlanDate(value);
}

export type TrackedValues = PlanDates & { price: number | null };

export type TrackedChange = {
  field: EditField;
  oldValue: string | null;
  newValue: string | null;
};

export function trackedChanges(
  before: TrackedValues,
  patch: Partial<TrackedValues>,
): TrackedChange[] {
  return EDIT_FIELDS.flatMap((field) => {
    const next = patch[field];
    if (next === undefined) {
      return [];
    }
    const oldValue = textOf(before[field]);
    const newValue = textOf(next);
    return oldValue === newValue ? [] : [{ field, oldValue, newValue }];
  });
}
