"use server";

import "server-only";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { Role } from "@/generated/prisma/enums";
import {
  cachedGetter,
  protectedEffect,
  runEffectAsFormAction,
} from "@/lib/effect";
import {
  addNoteEffect,
  addPhaseEffect,
  deleteNoteEffect,
  deletePhaseEffect,
  deletePieceEffect,
  editNoteEffect,
  getAllProjectsEffect,
  getFicheSuggestionsEffect,
  getPipelineProjectsEffect,
  getProjectEffect,
  getProjectNotesEffect,
  getProjectsEffect,
  getUpcomingDeliveriesEffect,
  movePieceEffect,
  renamePhaseEffect,
  restoreNoteEffect,
  restorePieceEffect,
  saveProjectContactsEffect,
} from "@/effects/projects";
import {
  addFileSectionEffect,
  createProjectEffect,
  deleteFileSectionEffect,
  duplicatePieceEffect,
  ensurePieceFoldersEffect,
  renameFileSectionEffect,
  restoreFileSectionEffect,
  savePieceWithFoldersEffect,
  saveProjectHeaderWithFoldersEffect,
} from "@/effects/projectFolders";
import {
  getProjectHomeEffect,
  isProjectPinnedEffect,
  pinProjectEffect,
  recordProjectViewEffect,
  reorderPinsEffect,
  unpinProjectEffect,
} from "@/effects/projectHome";
import { projectPath } from "@/lib/paths";
import {
  NoteEditFormSchema,
  NoteFormSchema,
  PieceFormSchema,
  ProjectContactsFormSchema,
  ProjectCreateFormSchema,
  ProjectHeaderFormSchema,
  type NoteEditFormErrors,
  type NoteEditFormState,
  type NoteFormErrors,
  type NoteFormState,
  type PieceFormErrors,
  type PieceFormState,
  type ProjectContactsFormErrors,
  type ProjectContactsFormState,
  type ProjectCreateFormErrors,
  type ProjectCreateFormState,
  type ProjectHeaderFormErrors,
  type ProjectHeaderFormState,
} from "@/schemas/projects.schemas";

export const getProjects = cachedGetter(getProjectsEffect, [Role.atelier]);

export const getAllProjects = cachedGetter(getAllProjectsEffect, [
  Role.manager,
]);

export const getProject = cachedGetter(getProjectEffect, [Role.employee]);

export const getProjectNotes = cachedGetter(getProjectNotesEffect, [
  Role.employee,
]);

export const getFicheSuggestions = cachedGetter(getFicheSuggestionsEffect, [
  Role.employee,
]);

export const getProjectHome = cachedGetter(getProjectHomeEffect, [
  Role.employee,
]);

export const isProjectPinned = cachedGetter(isProjectPinnedEffect, [
  Role.employee,
]);

export const getPipelineProjects = cachedGetter(getPipelineProjectsEffect, [
  Role.employee,
]);

export const getUpcomingDeliveries = cachedGetter(getUpcomingDeliveriesEffect, [
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
  >(
    formState,
    formData,
    ProjectHeaderFormSchema,
    saveProjectHeaderWithFoldersEffect,
    [Role.employee],
  );
  refresh();
  return state;
}

export async function createProject(
  formState: ProjectCreateFormState,
  formData: FormData,
): Promise<ProjectCreateFormState> {
  const state = await runEffectAsFormAction<
    ProjectCreateFormState,
    typeof ProjectCreateFormSchema,
    ProjectCreateFormErrors
  >(formState, formData, ProjectCreateFormSchema, createProjectEffect, [
    Role.employee,
  ]);
  if (state?.projectId) {
    redirect(projectPath(state.projectId));
  }
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
  >(formState, formData, PieceFormSchema, savePieceWithFoldersEffect, [
    Role.employee,
  ]);
  refresh();
  return state;
}

export async function addNote(
  formState: NoteFormState,
  formData: FormData,
): Promise<NoteFormState> {
  const state = await runEffectAsFormAction<
    NoteFormState,
    typeof NoteFormSchema,
    NoteFormErrors
  >(formState, formData, NoteFormSchema, addNoteEffect, [Role.employee]);
  refresh();
  return state;
}

export async function editNote(
  formState: NoteEditFormState,
  formData: FormData,
): Promise<NoteEditFormState> {
  const state = await runEffectAsFormAction<
    NoteEditFormState,
    typeof NoteEditFormSchema,
    NoteEditFormErrors
  >(formState, formData, NoteEditFormSchema, editNoteEffect, [Role.employee]);
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

const restorePieceMutation = protectedEffect(
  restorePieceEffect,
  [Role.employee],
  "mutation",
);
const duplicatePieceMutation = protectedEffect(
  duplicatePieceEffect,
  [Role.employee],
  "mutation",
);
const ensurePieceFoldersMutation = protectedEffect(
  ensurePieceFoldersEffect,
  [Role.employee],
  "mutation",
);
const addFileSectionMutation = protectedEffect(
  addFileSectionEffect,
  [Role.employee],
  "mutation",
);
const renameFileSectionMutation = protectedEffect(
  renameFileSectionEffect,
  [Role.employee],
  "mutation",
);
const deleteFileSectionMutation = protectedEffect(
  deleteFileSectionEffect,
  [Role.employee],
  "mutation",
);
const restoreFileSectionMutation = protectedEffect(
  restoreFileSectionEffect,
  [Role.employee],
  "mutation",
);

export async function restorePiece(pieceId: number): Promise<void> {
  await restorePieceMutation(pieceId);
  refresh();
}

export async function duplicatePiece(pieceId: number): Promise<void> {
  await duplicatePieceMutation(pieceId);
  refresh();
}

export async function ensurePieceFolders(pieceId: number): Promise<void> {
  await ensurePieceFoldersMutation(pieceId);
  refresh();
}

export async function addFileSection(
  projectId: string,
  pieceId: number | null,
  name: string,
): Promise<void> {
  await addFileSectionMutation(projectId, pieceId, name);
  refresh();
}

export async function renameFileSection(
  sectionId: number,
  name: string,
): Promise<void> {
  await renameFileSectionMutation(sectionId, name);
  refresh();
}

export async function deleteFileSection(sectionId: number): Promise<void> {
  await deleteFileSectionMutation(sectionId);
  refresh();
}

export async function restoreFileSection(sectionId: number): Promise<void> {
  await restoreFileSectionMutation(sectionId);
  refresh();
}

const deleteNoteMutation = protectedEffect(
  deleteNoteEffect,
  [Role.employee],
  "mutation",
);
const restoreNoteMutation = protectedEffect(
  restoreNoteEffect,
  [Role.employee],
  "mutation",
);

export async function deleteNote(noteId: number): Promise<void> {
  await deleteNoteMutation(noteId);
  refresh();
}

export async function restoreNote(noteId: number): Promise<void> {
  await restoreNoteMutation(noteId);
  refresh();
}

const recordProjectViewMutation = protectedEffect(
  recordProjectViewEffect,
  [Role.employee],
  "mutation",
);
const pinProjectMutation = protectedEffect(
  pinProjectEffect,
  [Role.employee],
  "mutation",
);
const unpinProjectMutation = protectedEffect(
  unpinProjectEffect,
  [Role.employee],
  "mutation",
);
const reorderPinsMutation = protectedEffect(
  reorderPinsEffect,
  [Role.employee],
  "mutation",
);

export async function recordProjectView(projectId: string): Promise<void> {
  await recordProjectViewMutation(projectId);
}

export async function pinProject(projectId: string): Promise<void> {
  await pinProjectMutation(projectId);
  refresh();
}

export async function unpinProject(projectId: string): Promise<void> {
  await unpinProjectMutation(projectId);
  refresh();
}

export async function reorderPins(projectIds: string[]): Promise<void> {
  await reorderPinsMutation(projectIds);
  refresh();
}
