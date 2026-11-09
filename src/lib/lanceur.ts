import {
  LANCEUR_CURRENCY,
  LANCEUR_DAY_MONTH_OPTIONS,
  LANCEUR_LOCALE,
  LANCEUR_NO_VALUE_LABEL,
  LANCEUR_PHASE_SEPARATOR,
} from "@/constants/lanceur";
import { toDateKey, type DateKey } from "@/lib/calendar";
import type { PlanItem } from "@/lib/lanceurPlan";
import type { LanceurPatch } from "@/schemas/lanceur.schemas";

export type LanceurRow = {
  phaseId: number;
  projectId: string;
  projectName: string;
  phaseName: string;
  phaseCount: number;
  priority: number;
  etape: string;
  isSigned: boolean;
  approvedOverride: boolean | null;
  pdmDate: DateKey | null;
  approvalDate: DateKey | null;
  deliveryDate: DateKey | null;
  price: number | null;
  installateur: string;
  deliveryComment: string;
  responsibleId: number | null;
  responsibleName: string | null;
  responsibleColor: string | null;
};

export type ApprovalState = {
  approvedOverride: boolean | null;
  approvalDate: DateKey | null;
};

export function isApproved(state: ApprovalState, today: DateKey): boolean {
  if (state.approvedOverride !== null) {
    return state.approvedOverride;
  }
  return state.approvalDate !== null && state.approvalDate <= today;
}

export function todayKey(now: Date): DateKey {
  return toDateKey(now);
}

export type PhaseLabelSource = {
  projectName: string;
  phaseName: string;
  phaseCount: number;
};

export function phaseLabel({
  projectName,
  phaseName,
  phaseCount,
}: PhaseLabelSource) {
  return phaseCount > 1
    ? `${projectName}${LANCEUR_PHASE_SEPARATOR}${phaseName}`
    : projectName;
}

const shortDateFormatter = new Intl.DateTimeFormat(
  LANCEUR_LOCALE,
  LANCEUR_DAY_MONTH_OPTIONS,
);

export function formatShortDate(date: DateKey | null): string {
  if (date === null) {
    return LANCEUR_NO_VALUE_LABEL;
  }
  return shortDateFormatter.format(new Date(`${date}T00:00:00Z`));
}

export function formatPrice(price: number | null): string {
  if (price === null) {
    return LANCEUR_NO_VALUE_LABEL;
  }
  return price.toLocaleString(LANCEUR_LOCALE, {
    style: "currency",
    currency: LANCEUR_CURRENCY,
    maximumFractionDigits: 0,
  });
}

export function sortRows(rows: readonly LanceurRow[]): LanceurRow[] {
  return [...rows].sort(
    (a, b) =>
      a.priority - b.priority ||
      phaseLabel(a).localeCompare(phaseLabel(b), LANCEUR_LOCALE),
  );
}

export function mergeOptionValue(
  values: readonly string[],
  current: string,
): string[] {
  return current !== "" && !values.includes(current)
    ? [current, ...values]
    : [...values];
}

export type LanceurEmployee = {
  id: number;
  name: string;
  color: string;
};

export function applyPatch(
  row: LanceurRow,
  patch: LanceurPatch,
  employees: readonly LanceurEmployee[],
): LanceurRow {
  const next: LanceurRow = { ...row };
  if (patch.pdmDate !== undefined) next.pdmDate = patch.pdmDate;
  if (patch.approvalDate !== undefined) {
    next.approvalDate = patch.approvalDate;
    if (patch.approvedOverride === undefined) next.approvedOverride = null;
  }
  if (patch.deliveryDate !== undefined) next.deliveryDate = patch.deliveryDate;
  if (patch.price !== undefined) next.price = patch.price;
  if (patch.isSigned !== undefined) next.isSigned = patch.isSigned;
  if (patch.approvedOverride !== undefined)
    next.approvedOverride = patch.approvedOverride;
  if (patch.priority !== undefined) next.priority = patch.priority;
  if (patch.etape !== undefined) next.etape = patch.etape;
  if (patch.installateur !== undefined) next.installateur = patch.installateur;
  if (patch.deliveryComment !== undefined)
    next.deliveryComment = patch.deliveryComment;
  if (patch.responsibleId !== undefined) {
    const employee = employees.find(({ id }) => id === patch.responsibleId);
    next.responsibleId = patch.responsibleId;
    next.responsibleName = employee?.name ?? null;
    next.responsibleColor = employee?.color ?? null;
  }
  return next;
}

export function toPlanItem(row: LanceurRow): PlanItem {
  return {
    id: row.phaseId,
    label: phaseLabel(row),
    color: row.responsibleColor,
    pdmDate: row.pdmDate,
    approvalDate: row.approvalDate,
    deliveryDate: row.deliveryDate,
    price: row.price,
  };
}
