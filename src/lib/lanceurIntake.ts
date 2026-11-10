import {
  INTAKE_KEY_SEPARATOR,
  INTAKE_NEW_PHASE_KEY,
  INTAKE_VALUE_REQUIRED_MESSAGE,
} from "@/constants/lanceurIntake";
import type { LanceurRow } from "@/lib/lanceur";
import { phaseName } from "@/lib/projects";
import type { LanceurPatch } from "@/schemas/lanceur.schemas";

export type IntakeSlot = {
  key: string;
  phaseId: number | null;
  name: string;
};

export type IntakeProject = {
  id: string;
  name: string;
  color: string;
  slots: IntakeSlot[];
};

export type IntakePhaseRecord = {
  id: number;
  name: string;
  isInLanceur: boolean;
};

export type SlotForm = {
  price: string;
  pdmDate: string;
  approvalDate: string;
  deliveryDate: string;
  etape: string;
  installateur: string;
  responsibleId: string;
};

export const EMPTY_SLOT_FORM: SlotForm = {
  price: "",
  pdmDate: "",
  approvalDate: "",
  deliveryDate: "",
  etape: "",
  installateur: "",
  responsibleId: "",
};

export type IntakeEntry = {
  projectId: string;
  phaseId: number | null;
  price: number;
  pdmDate: string | null;
  approvalDate: string | null;
  deliveryDate: string | null;
  etape: string;
  installateur: string;
  responsibleId: number | null;
};

export function slotKey(projectId: string, phaseId: number | null): string {
  return `${projectId}${INTAKE_KEY_SEPARATOR}${phaseId ?? INTAKE_NEW_PHASE_KEY}`;
}

export function intakeSlots(
  projectId: string,
  phases: readonly IntakePhaseRecord[],
): IntakeSlot[] {
  if (phases.length === 0) {
    return [
      {
        key: slotKey(projectId, null),
        phaseId: null,
        name: phaseName(1),
      },
    ];
  }
  return phases
    .filter(({ isInLanceur }) => !isInLanceur)
    .map(({ id, name }) => ({
      key: slotKey(projectId, id),
      phaseId: id,
      name,
    }));
}

export type IntakeBuild = {
  entries: IntakeEntry[];
  errors: Record<string, string>;
};

function orNull(value: string): string | null {
  return value === "" ? null : value;
}

export function buildIntakeEntries(
  projectId: string,
  slots: readonly IntakeSlot[],
  forms: Readonly<Record<string, SlotForm>>,
): IntakeBuild {
  const entries: IntakeEntry[] = [];
  const errors: Record<string, string> = {};
  for (const slot of slots) {
    const form = forms[slot.key];
    if (!form) {
      continue;
    }
    const price = Number(form.price);
    if (form.price.trim() === "" || !Number.isFinite(price) || price <= 0) {
      errors[slot.key] = INTAKE_VALUE_REQUIRED_MESSAGE;
      continue;
    }
    entries.push({
      projectId,
      phaseId: slot.phaseId,
      price,
      pdmDate: orNull(form.pdmDate),
      approvalDate: orNull(form.approvalDate),
      deliveryDate: orNull(form.deliveryDate),
      etape: form.etape,
      installateur: form.installateur,
      responsibleId:
        form.responsibleId === "" ? null : Number(form.responsibleId),
    });
  }
  return { entries, errors };
}

export function rowToSlotForm(row: LanceurRow): SlotForm {
  return {
    price: row.price === null ? "" : String(row.price),
    pdmDate: row.pdmDate ?? "",
    approvalDate: row.approvalDate ?? "",
    deliveryDate: row.deliveryDate ?? "",
    etape: row.etape,
    installateur: row.installateur,
    responsibleId: row.responsibleId === null ? "" : String(row.responsibleId),
  };
}

type MutablePatch = { -readonly [K in keyof LanceurPatch]: LanceurPatch[K] };

export type RowPatchBuild = {
  patch: LanceurPatch;
  error: string | null;
};

export function buildRowPatch(row: LanceurRow, form: SlotForm): RowPatchBuild {
  const price = Number(form.price);
  if (form.price.trim() === "" || !Number.isFinite(price) || price <= 0) {
    return { patch: {}, error: INTAKE_VALUE_REQUIRED_MESSAGE };
  }
  const before = rowToSlotForm(row);
  const patch: MutablePatch = {};
  if (form.price !== before.price && price !== row.price) patch.price = price;
  if (form.pdmDate !== before.pdmDate) patch.pdmDate = orNull(form.pdmDate);
  if (form.approvalDate !== before.approvalDate) {
    patch.approvalDate = orNull(form.approvalDate);
  }
  if (form.deliveryDate !== before.deliveryDate) {
    patch.deliveryDate = orNull(form.deliveryDate);
  }
  if (form.etape !== before.etape) patch.etape = form.etape;
  if (form.installateur !== before.installateur) {
    patch.installateur = form.installateur;
  }
  if (form.responsibleId !== before.responsibleId) {
    patch.responsibleId =
      form.responsibleId === "" ? null : Number(form.responsibleId);
  }
  return { patch, error: null };
}
