"use server";

import "server-only";

import { runEffectAsFormAction } from "@/lib/effect";

import {
  type EditTimeEntryFormState,
  type EditTimeEntryFormErrors,
  EditTimeEntryFormSchema,
} from "@/schemas/timeEntries.schemas";
import { Role } from "@/generated/prisma/client";
import { cachedGetter, protectedEffect } from "@/lib/effect";
import {
  deleteTimeEntryEffect,
  editTimeEntryEffect,
  getTimeEntriesEffect,
  putTimeEntryEffect,
} from "@/effects/timeEntries";

export const getTimeEntries = cachedGetter(getTimeEntriesEffect, Role.employee);

export async function editTimeEntry(
  formState: EditTimeEntryFormState,
  formData: FormData,
): Promise<EditTimeEntryFormState> {
  return runEffectAsFormAction<
    EditTimeEntryFormState,
    typeof EditTimeEntryFormSchema,
    EditTimeEntryFormErrors
  >(
    formState,
    formData,
    EditTimeEntryFormSchema,
    editTimeEntryEffect,
    Role.employee,
  );
}
export const putTimeEntry = protectedEffect(
  putTimeEntryEffect,
  Role.employee,
  "mutation",
);

export const deleteTimeEntry = protectedEffect(
  deleteTimeEntryEffect,
  Role.employee,
  "mutation",
);
