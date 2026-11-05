"use server";

import "server-only";

import { refresh } from "next/cache";

import { Role } from "@/generated/prisma/enums";
import {
  addLanceurOptionEffect,
  addLanceurPhaseEffect,
  deleteLanceurOptionEffect,
  getAvailablePhasesEffect,
  getLanceurEmployeesEffect,
  getLanceurOptionsEffect,
  getLanceurRowsEffect,
  removeLanceurPhaseEffect,
  updateLanceurPhaseEffect,
} from "@/effects/lanceur";
import { cachedGetter, protectedEffect } from "@/lib/effect";
import type {
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

export const getAvailablePhases = cachedGetter(getAvailablePhasesEffect, [
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

export async function addLanceurPhase(phaseId: number) {
  const result = await addPhaseMutation(phaseId);
  refresh();
  return result;
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
