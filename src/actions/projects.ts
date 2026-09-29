"use server";

import "server-only";

import { refresh } from "next/cache";

import { Role } from "@/generated/prisma/enums";
import {
  cachedGetter,
  protectedEffect,
  runEffectAsFormAction,
} from "@/lib/effect";
import {
  addPhaseEffect,
  deletePhaseEffect,
  deletePieceEffect,
  getAllProjectsEffect,
  getFicheSuggestionsEffect,
  getProjectEffect,
  getProjectsEffect,
  movePieceEffect,
  renamePhaseEffect,
  saveProjectContactsEffect,
  saveProjectHeaderEffect,
  savePieceEffect,
} from "@/effects/projects";
import {
  PieceFormSchema,
  ProjectContactsFormSchema,
  ProjectHeaderFormSchema,
  type PieceFormErrors,
  type PieceFormState,
  type ProjectContactsFormErrors,
  type ProjectContactsFormState,
  type ProjectHeaderFormErrors,
  type ProjectHeaderFormState,
} from "@/schemas/projects.schemas";

export const getProjects = cachedGetter(getProjectsEffect, [Role.employee]);

export const getAllProjects = cachedGetter(getAllProjectsEffect, [
  Role.manager,
]);

export const getProject = cachedGetter(getProjectEffect, [Role.employee]);

export const getFicheSuggestions = cachedGetter(getFicheSuggestionsEffect, [
  Role.employee,
]);

export async function saveProjectHeader(
  formState: ProjectHeaderFormState,
  formData: FormData,
): Promise<ProjectHeaderFormState> {
  const state = await runEffectAsFormAction<
    ProjectHeaderFormState,
    typeof ProjectHeaderFormSchema,
    ProjectHeaderFormErrors
  >(formState, formData, ProjectHeaderFormSchema, saveProjectHeaderEffect, [
    Role.employee,
  ]);
  refresh();
  return state;
}

export async function saveProjectContacts(
  formState: ProjectContactsFormState,
  formData: FormData,
): Promise<ProjectContactsFormState> {
  const state = await runEffectAsFormAction<
    ProjectContactsFormState,
    typeof ProjectContactsFormSchema,
    ProjectContactsFormErrors
  >(formState, formData, ProjectContactsFormSchema, saveProjectContactsEffect, [
    Role.employee,
  ]);
  refresh();
  return state;
}

export async function savePiece(
  formState: PieceFormState,
  formData: FormData,
): Promise<PieceFormState> {
  const state = await runEffectAsFormAction<
    PieceFormState,
    typeof PieceFormSchema,
    PieceFormErrors
  >(formState, formData, PieceFormSchema, savePieceEffect, [Role.employee]);
  refresh();
  return state;
}

const addPhaseMutation = protectedEffect(
  addPhaseEffect,
  [Role.employee],
  "mutation",
);
const renamePhaseMutation = protectedEffect(
  renamePhaseEffect,
  [Role.employee],
  "mutation",
);
const deletePhaseMutation = protectedEffect(
  deletePhaseEffect,
  [Role.employee],
  "mutation",
);
const deletePieceMutation = protectedEffect(
  deletePieceEffect,
  [Role.employee],
  "mutation",
);
const movePieceMutation = protectedEffect(
  movePieceEffect,
  [Role.employee],
  "mutation",
);

export async function addPhase(projectId: string): Promise<void> {
  await addPhaseMutation(projectId);
  refresh();
}

export async function renamePhase(
  phaseId: number,
  name: string,
): Promise<void> {
  await renamePhaseMutation(phaseId, name);
  refresh();
}

export async function deletePhase(phaseId: number): Promise<void> {
  await deletePhaseMutation(phaseId);
  refresh();
}

export async function movePiece(
  pieceId: number,
  phaseId: number | null,
): Promise<void> {
  await movePieceMutation(pieceId, phaseId);
  refresh();
}

export async function deletePiece(pieceId: number): Promise<void> {
  await deletePieceMutation(pieceId);
  refresh();
}
