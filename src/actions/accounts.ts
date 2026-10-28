"use server";

import "server-only";

import { Role } from "@/generated/prisma/enums";
import { cachedGetter, runEffectAsFormAction } from "@/lib/effect";
import {
  archiveEmployeeEffect,
  editPersonEffect,
  getPeopleEffect,
  getStatutsEffect,
  removeAccountEffect,
  resetPasswordEffect,
} from "@/effects/accounts";
import {
  ArchiveEmployeeFormSchema,
  EditPersonFormSchema,
  UserIdFormSchema,
  type AccountFormErrors,
  type AccountFormState,
} from "@/schemas/accounts.schemas";

export const getPeople = cachedGetter(getPeopleEffect, [Role.manager]);

export const getStatuts = cachedGetter(getStatutsEffect, [Role.manager]);

export async function editPerson(
  formState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  return runEffectAsFormAction<
    AccountFormState,
    typeof EditPersonFormSchema,
    AccountFormErrors
  >(formState, formData, EditPersonFormSchema, editPersonEffect, [
    Role.manager,
  ]);
}

export async function archiveEmployee(
  formState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  return runEffectAsFormAction<
    AccountFormState,
    typeof ArchiveEmployeeFormSchema,
    AccountFormErrors
  >(formState, formData, ArchiveEmployeeFormSchema, archiveEmployeeEffect, [
    Role.manager,
  ]);
}

export async function resetPassword(
  formState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  return runEffectAsFormAction<
    AccountFormState,
    typeof UserIdFormSchema,
    AccountFormErrors
  >(formState, formData, UserIdFormSchema, resetPasswordEffect, [Role.manager]);
}

export async function removeAccount(
  formState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  return runEffectAsFormAction<
    AccountFormState,
    typeof UserIdFormSchema,
    AccountFormErrors
  >(formState, formData, UserIdFormSchema, removeAccountEffect, [Role.manager]);
}
