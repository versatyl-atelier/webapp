"use server";

import "server-only";

import { runEffectAsFormAction } from "@/lib/effect";

import {
  type EditTimeEntryFormState,
  type EditTimeEntryFormErrors,
  type AddManualTimeFormState,
  type AddManualTimeFormErrors,
  type MoveTimeEntryFormState,
  type MoveTimeEntryFormErrors,
  EditTimeEntryFormSchema,
  AddManualTimeFormSchema,
  MoveTimeEntryFormSchema,
} from "@/schemas/timeEntries.schemas";
import { Role } from "@/generated/prisma/client";
import { cachedGetter, protectedEffect } from "@/lib/effect";
import {
  addManualTimeEffect,
  deleteTimeEntryEffect,
  editTimeEntryEffect,
  getTimeEntriesEffect,
  moveTimeEntryEffect,
  putTimeEntryEffect,
} from "@/effects/timeEntries";

export const getTimeEntries = cachedGetter(getTimeEntriesEffect, [
  Role.atelier,
]);

export async function editTimeEntry(
  formState: EditTimeEntryFormState,
  formData: FormData,
): Promise<EditTimeEntryFormState> {
  return runEffectAsFormAction<
    EditTimeEntryFormState,
    typeof EditTimeEntryFormSchema,
    EditTimeEntryFormErrors
  >(formState, formData, EditTimeEntryFormSchema, editTimeEntryEffect, [
    Role.atelier,
  ]);
}
export const putTimeEntry = protectedEffect(
  putTimeEntryEffect,
  [Role.atelier],
  "mutation",
);

export const deleteTimeEntry = protectedEffect(
  deleteTimeEntryEffect,
  [Role.atelier],
  "mutation",
);

export async function addManualTime(
  formState: AddManualTimeFormState,
  formData: FormData,
): Promise<AddManualTimeFormState> {
  return runEffectAsFormAction<
    AddManualTimeFormState,
    typeof AddManualTimeFormSchema,
    AddManualTimeFormErrors
  >(formState, formData, AddManualTimeFormSchema, addManualTimeEffect, [
    Role.atelier,
  ]);
}

export async function moveTimeEntry(
  formState: MoveTimeEntryFormState,
  formData: FormData,
): Promise<MoveTimeEntryFormState> {
  return runEffectAsFormAction<
    MoveTimeEntryFormState,
    typeof MoveTimeEntryFormSchema,
    MoveTimeEntryFormErrors
  >(formState, formData, MoveTimeEntryFormSchema, moveTimeEntryEffect, [
    Role.atelier,
  ]);
}
