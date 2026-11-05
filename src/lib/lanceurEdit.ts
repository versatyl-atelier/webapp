import {
  EDIT_FIELDS,
  EDIT_FIELD_LABELS,
  EDIT_REPORT_AFTER_HEADER,
  EDIT_REPORT_BEFORE_HEADER,
  EDIT_REPORT_FIELD_HEADER,
  EDIT_REPORT_TITLE,
  editReportSummary,
  type EditField,
} from "@/constants/lanceurEdit";
import { LANCEUR_NO_VALUE_LABEL } from "@/constants/lanceur";
import type { DateKey } from "@/lib/calendar";
import { formatPrice, phaseLabel, type LanceurRow } from "@/lib/lanceur";
import { escapeHtml } from "@/lib/text";

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

export function formatChangeValue(
  field: EditField,
  value: string | null,
): string {
  if (value === null || value === "") {
    return LANCEUR_NO_VALUE_LABEL;
  }
  return field === "price" ? formatPrice(Number(value)) : value;
}

export function buildChangeReport(
  changes: readonly EditChange[],
  savedAtLabel: string,
): string {
  const byLabel = new Map<string, EditChange[]>();
  for (const change of changes) {
    byLabel.set(change.label, [...(byLabel.get(change.label) ?? []), change]);
  }
  const sections = [...byLabel.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "fr"))
    .map(([label, entries]) => {
      const rows = entries
        .map(
          (change) =>
            `<tr><td>${escapeHtml(EDIT_FIELD_LABELS[change.field])}</td><td class="old">${escapeHtml(formatChangeValue(change.field, change.oldValue))}</td><td class="new">${escapeHtml(formatChangeValue(change.field, change.newValue))}</td></tr>`,
        )
        .join("");
      return `<h2>${escapeHtml(label)}</h2><table><tr><th>${EDIT_REPORT_FIELD_HEADER}</th><th>${EDIT_REPORT_BEFORE_HEADER}</th><th>${EDIT_REPORT_AFTER_HEADER}</th></tr>${rows}</table>`;
    })
    .join("");
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>${EDIT_REPORT_TITLE}</title><style>body{font-family:sans-serif;max-width:820px;margin:32px auto;padding:0 16px}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #ccc;padding:6px 10px;text-align:left}th{background:#eee}.old{color:#b03030}.new{color:#065f46;font-weight:600}</style></head><body><h1>${EDIT_REPORT_TITLE}</h1><p>${escapeHtml(savedAtLabel)} : ${editReportSummary(changes.length, byLabel.size)}</p>${sections}</body></html>`;
}
