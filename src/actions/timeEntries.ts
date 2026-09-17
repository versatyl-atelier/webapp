"use server";

import "server-only";

import { runEffectAsFormAction } from "@/lib/effect";

import {
  type EditTimeEntryFormState,
  type EditTimeEntryFormErrors,
  type AddManualTimeFormState,
  type AddManualTimeFormErrors,
  type FillDayFormState,
  type FillDayFormErrors,
  EditTimeEntryFormSchema,
  AddManualTimeFormSchema,
  FillDayFormSchema,
} from "@/schemas/timeEntries.schemas";
import { Role } from "@/generated/prisma/client";
import { cachedGetter, protectedEffect } from "@/lib/effect";
import {
  addManualTimeEffect,
  deleteTimeEntryEffect,
  editTimeEntryEffect,
  fillDayEffect,
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

export async function addManualTime(
  formState: AddManualTimeFormState,
  formData: FormData,
): Promise<AddManualTimeFormState> {
  return runEffectAsFormAction<
    AddManualTimeFormState,
    typeof AddManualTimeFormSchema,
    AddManualTimeFormErrors
  >(
    formState,
    formData,
    AddManualTimeFormSchema,
    addManualTimeEffect,
    Role.employee,
  );
}

export async function fillDay(
  formState: FillDayFormState,
  formData: FormData,
): Promise<FillDayFormState> {
  return runEffectAsFormAction<
    FillDayFormState,
    typeof FillDayFormSchema,
    FillDayFormErrors
  >(formState, formData, FillDayFormSchema, fillDayEffect, Role.employee);
}
