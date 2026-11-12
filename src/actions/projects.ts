"use server";

import "server-only";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { Role, type TrelloCardRole } from "@/generated/prisma/enums";
import {
  cachedGetter,
  protectedEffect,
  runEffectAsFormAction,
} from "@/lib/effect";
import {
  addNoteEffect,
  deleteNoteEffect,
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
  deleteContactEffect,
  restoreContactEffect,
  saveContactEffect,
  saveProjectColorEffect,
  saveProjectLocationEffect,
} from "@/effects/projects";
import {
  addPhaseWithTrelloEffect,
  deletePhaseWithTrelloEffect,
  deletePieceWithTrelloEffect,
  restorePieceWithTrelloEffect,
} from "@/effects/projectTrello";
import {
  createDesignCardEffect,
  getProjectTrelloEffect,
  regenerateCardEffect,
  sendPieceCardsEffect,
} from "@/effects/trelloCards";
import {
  addFileSectionEffect,
  createProjectEffect,
  createProjectFolderEffect,
  deleteFileSectionEffect,
  duplicatePieceEffect,
  recreateProjectTreeEffect,
  recreateSectionFolderEffect,
  renameFileSectionEffect,
  restoreFileSectionEffect,
  savePieceWithFoldersEffect,
  saveProjectHeaderWithFoldersEffect,
  syncFromDropboxEffect,
  unlinkProjectEffect,
} from "@/effects/projectFolders";
import {
  getProjectHomeEffect,
  isProjectPinnedEffect,
  pinProjectEffect,
  recordProjectViewEffect,
  reorderPinsEffect,
  unpinProjectEffect,
} from "@/effects/projectHome";
import {
  createUploadEffect,
  deleteFileEffect,
  finalizeUploadEffect,
  getFileLinkEffect,
  listSectionFilesEffect,
  restoreFileEffect,
} from "@/effects/projectFiles";
import {
  clearPieceCoverEffect,
  saveCoverImageEffect,
  setCoverFramingEffect,
} from "@/effects/projectCovers";
import { projectPath } from "@/lib/paths";
import {
  NoteEditFormSchema,
  NoteFormSchema,
  PieceFormSchema,
  ContactFormSchema,
  CoverImageFormSchema,
  ProjectColorFormSchema,
  ProjectLocationFormSchema,
  ProjectCreateFormSchema,
  ProjectHeaderFormSchema,
  type NoteEditFormErrors,
  type NoteEditFormState,
  type NoteFormErrors,
  type NoteFormState,
  type PieceFormErrors,
  type PieceFormState,
  type ContactFormErrors,
  type ContactFormState,
  type CoverImageFormErrors,
  type CoverImageFormState,
  type ProjectColorFormErrors,
  type ProjectColorFormState,
  type ProjectLocationFormErrors,
  type ProjectLocationFormState,
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

export const getProjectTrello = cachedGetter(getProjectTrelloEffect, [
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

export async function saveProjectColor(
  formState: ProjectColorFormState,
  formData: FormData,
): Promise<ProjectColorFormState> {
  const state = await runEffectAsFormAction<
    ProjectColorFormState,
    typeof ProjectColorFormSchema,
    ProjectColorFormErrors
  >(formState, formData, ProjectColorFormSchema, saveProjectColorEffect, [
    Role.employee,
  ]);
  refresh();
  return state;
}

export async function saveProjectLocation(
  formState: ProjectLocationFormState,
  formData: FormData,
): Promise<ProjectLocationFormState> {
  const state = await runEffectAsFormAction<
    ProjectLocationFormState,
    typeof ProjectLocationFormSchema,
    ProjectLocationFormErrors
  >(formState, formData, ProjectLocationFormSchema, saveProjectLocationEffect, [
    Role.employee,
  ]);
  refresh();
  return state;
}

export async function saveContact(
  formState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const state = await runEffectAsFormAction<
    ContactFormState,
    typeof ContactFormSchema,
    ContactFormErrors
  >(formState, formData, ContactFormSchema, saveContactEffect, [Role.employee]);
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
  addPhaseWithTrelloEffect,
  [Role.employee],
  "mutation",
);
const renamePhaseMutation = protectedEffect(
  renamePhaseEffect,
  [Role.employee],
  "mutation",
);
const deletePhaseMutation = protectedEffect(
  deletePhaseWithTrelloEffect,
  [Role.employee],
  "mutation",
);
const deletePieceMutation = protectedEffect(
  deletePieceWithTrelloEffect,
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

const deleteContactMutation = protectedEffect(
  deleteContactEffect,
  [Role.employee],
  "mutation",
);
const restoreContactMutation = protectedEffect(
  restoreContactEffect,
  [Role.employee],
  "mutation",
);
const restorePieceMutation = protectedEffect(
  restorePieceWithTrelloEffect,
  [Role.employee],
  "mutation",
);
const duplicatePieceMutation = protectedEffect(
  duplicatePieceEffect,
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

export async function deleteContact(contactId: number): Promise<void> {
  await deleteContactMutation(contactId);
  refresh();
}

export async function restoreContact(contactId: number): Promise<void> {
  await restoreContactMutation(contactId);
  refresh();
}

export async function restorePiece(pieceId: number): Promise<void> {
  await restorePieceMutation(pieceId);
  refresh();
}

export async function duplicatePiece(pieceId: number): Promise<void> {
  await duplicatePieceMutation(pieceId);
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

const listSectionFilesRead = protectedEffect(
  listSectionFilesEffect,
  [Role.employee],
  "read",
);
const getFileLinkRead = protectedEffect(
  getFileLinkEffect,
  [Role.employee],
  "read",
);
const createUploadMutation = protectedEffect(
  createUploadEffect,
  [Role.employee],
  "mutation",
);
const finalizeUploadMutation = protectedEffect(
  finalizeUploadEffect,
  [Role.employee],
  "mutation",
);
const deleteFileMutation = protectedEffect(
  deleteFileEffect,
  [Role.employee],
  "mutation",
);
const restoreFileMutation = protectedEffect(
  restoreFileEffect,
  [Role.employee],
  "mutation",
);
const clearPieceCoverMutation = protectedEffect(
  clearPieceCoverEffect,
  [Role.employee],
  "mutation",
);
const setCoverFramingMutation = protectedEffect(
  setCoverFramingEffect,
  [Role.employee],
  "mutation",
);
const syncFromDropboxMutation = protectedEffect(
  syncFromDropboxEffect,
  [Role.employee],
  "mutation",
);
const recreateProjectTreeMutation = protectedEffect(
  recreateProjectTreeEffect,
  [Role.employee],
  "mutation",
);
const unlinkProjectMutation = protectedEffect(
  unlinkProjectEffect,
  [Role.employee],
  "mutation",
);
const createProjectFolderMutation = protectedEffect(
  createProjectFolderEffect,
  [Role.employee],
  "mutation",
);
const recreateSectionFolderMutation = protectedEffect(
  recreateSectionFolderEffect,
  [Role.employee],
  "mutation",
);

export async function listSectionFiles(sectionId: number, subpath: string) {
  return listSectionFilesRead(sectionId, subpath);
}

export async function getFileLink(projectId: string, fileId: string) {
  return getFileLinkRead(projectId, fileId);
}

export async function createUpload(
  sectionId: number,
  subpath: string,
  fileName: string,
  fileSize: number,
) {
  return createUploadMutation(sectionId, subpath, fileName, fileSize);
}

export async function finalizeUpload(
  sectionId: number,
  subpath: string,
  fileName: string,
) {
  return finalizeUploadMutation(sectionId, subpath, fileName);
}

export async function deleteFile(projectId: string, fileId: string) {
  return deleteFileMutation(projectId, fileId);
}

export async function restoreFile(
  projectId: string,
  path: string,
  rev: string,
): Promise<void> {
  await restoreFileMutation(projectId, path, rev);
}

export async function clearPieceCover(pieceId: number): Promise<void> {
  await clearPieceCoverMutation(pieceId);
  refresh();
}

export async function setCoverFraming(
  pieceId: number,
  framing: { x: number; y: number; zoom: number },
): Promise<void> {
  await setCoverFramingMutation(pieceId, framing);
  refresh();
}

export async function syncFromDropbox(projectId: string) {
  const result = await syncFromDropboxMutation(projectId);
  if (result.adopted > 0) {
    refresh();
  }
  return result;
}

export async function recreateProjectTree(projectId: string): Promise<void> {
  await recreateProjectTreeMutation(projectId);
  refresh();
}

export async function unlinkProject(projectId: string): Promise<void> {
  await unlinkProjectMutation(projectId);
  refresh();
}

export async function createProjectFolder(projectId: string): Promise<void> {
  await createProjectFolderMutation(projectId);
  refresh();
}

export async function recreateSectionFolder(sectionId: number): Promise<void> {
  await recreateSectionFolderMutation(sectionId);
  refresh();
}

export async function saveCoverImage(
  formState: CoverImageFormState,
  formData: FormData,
): Promise<CoverImageFormState> {
  const state = await runEffectAsFormAction<
    CoverImageFormState,
    typeof CoverImageFormSchema,
    CoverImageFormErrors
  >(formState, formData, CoverImageFormSchema, saveCoverImageEffect, [
    Role.employee,
  ]);
  refresh();
  return state;
}

const createDesignCardMutation = protectedEffect(
  createDesignCardEffect,
  [Role.employee],
  "mutation",
);
const sendPieceCardsMutation = protectedEffect(
  sendPieceCardsEffect,
  [Role.employee],
  "mutation",
);
const regenerateCardMutation = protectedEffect(
  regenerateCardEffect,
  [Role.employee],
  "mutation",
);

export async function createDesignCard(projectId: string): Promise<boolean> {
  const synced = await createDesignCardMutation(projectId);
  refresh();
  return synced;
}

export async function sendPieceCards(
  projectId: string,
  role: TrelloCardRole,
): Promise<boolean> {
  const synced = await sendPieceCardsMutation(projectId, role);
  refresh();
  return synced;
}

export async function regenerateCard(cardId: number): Promise<boolean> {
  const synced = await regenerateCardMutation(cardId);
  refresh();
  return synced;
}
