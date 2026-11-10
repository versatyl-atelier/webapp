"use server";

import "server-only";

import { refresh } from "next/cache";

import { Role } from "@/generated/prisma/enums";
import {
  addLanceurOptionEffect,
  addLanceurPhaseEffect,
  deleteLanceurOptionEffect,
  getImportableProjectsEffect,
  importLanceurPhasesEffect,
  getLanceurEmployeesEffect,
  getLanceurLogEffect,
  getLanceurOptionsEffect,
  getLanceurRowsEffect,
  getPlanSettingsEffect,
  removeLanceurPhaseEffect,
  updateLanceurPhaseEffect,
} from "@/effects/lanceur";
import { cachedGetter, protectedEffect } from "@/lib/effect";
import type {
  LanceurAddTarget,
  LanceurImportEntry,
  LanceurOptionInput,
  LanceurPatch,
} from "@/schemas/lanceur.schemas";

export const getLanceurRows = cachedGetter(getLanceurRowsEffect, [
  Role.employee,
]);

export const getLanceurOptions = cachedGetter(getLanceurOptionsEffect, [
  Role.employee,
]);

export const getLanceurEmployees = cachedGetter(getLanceurEmployeesEffect, [
  Role.employee,
]);

export const getPlanSettings = cachedGetter(getPlanSettingsEffect, [
  Role.employee,
]);

export const getImportableProjects = cachedGetter(getImportableProjectsEffect, [
  Role.employee,
]);

const updateMutation = protectedEffect(
  updateLanceurPhaseEffect,
  [Role.employee],
  "mutation",
);
const addPhaseMutation = protectedEffect(
  addLanceurPhaseEffect,
  [Role.employee],
  "mutation",
);
const logQuery = protectedEffect(getLanceurLogEffect, [Role.employee]);
const importPhasesMutation = protectedEffect(
  importLanceurPhasesEffect,
  [Role.employee],
  "mutation",
);
const removePhaseMutation = protectedEffect(
  removeLanceurPhaseEffect,
  [Role.employee],
  "mutation",
);
const addOptionMutation = protectedEffect(
  addLanceurOptionEffect,
  [Role.employee],
  "mutation",
);
const deleteOptionMutation = protectedEffect(
  deleteLanceurOptionEffect,
  [Role.employee],
  "mutation",
);

export async function updateLanceurPhase(phaseId: number, patch: LanceurPatch) {
  const result = await updateMutation(phaseId, patch);
  refresh();
  return result;
}

export async function addLanceurPhase(target: LanceurAddTarget) {
  const result = await addPhaseMutation(target);
  refresh();
  return result;
}

export async function importLanceurPhases(entries: LanceurImportEntry[]) {
  const result = await importPhasesMutation(entries);
  refresh();
  return result;
}

export async function getLanceurLog(phaseId: number) {
  return logQuery(phaseId);
}

export async function removeLanceurPhase(phaseId: number) {
  await removePhaseMutation(phaseId);
  refresh();
}

export async function addLanceurOption(input: LanceurOptionInput) {
  const result = await addOptionMutation(input);
  refresh();
  return result;
}

export async function deleteLanceurOption(optionId: number) {
  await deleteOptionMutation(optionId);
  refresh();
}
