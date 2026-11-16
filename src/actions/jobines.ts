"use server";

import "server-only";

import {
  addJobineEffect,
  archiveJobineEffect,
  editJobineEffect,
  getAllJobinesEffect,
  getJobinesEffect,
  restoreJobineEffect,
} from "@/effects/jobines";
import { Role } from "@/generated/prisma/enums";
import { cachedGetter, runEffectAsFormAction } from "@/lib/effect";
import {
  AddJobineFormSchema,
  EditJobineFormSchema,
  JobineIdFormSchema,
  type JobineFormErrors,
  type JobineFormState,
} from "@/schemas/jobines.schemas";

export const getJobines = cachedGetter(getJobinesEffect, [Role.atelier]);

export const getAllJobines = cachedGetter(getAllJobinesEffect, [Role.manager]);

export async function addJobine(
  formState: JobineFormState,
  formData: FormData,
): Promise<JobineFormState> {
  return runEffectAsFormAction<
    JobineFormState,
    typeof AddJobineFormSchema,
    JobineFormErrors
  >(formState, formData, AddJobineFormSchema, addJobineEffect, [Role.manager]);
}

export async function editJobine(
  formState: JobineFormState,
  formData: FormData,
): Promise<JobineFormState> {
  return runEffectAsFormAction<
    JobineFormState,
    typeof EditJobineFormSchema,
    JobineFormErrors
  >(formState, formData, EditJobineFormSchema, editJobineEffect, [
    Role.manager,
  ]);
}

export async function archiveJobine(
  formState: JobineFormState,
  formData: FormData,
): Promise<JobineFormState> {
  return runEffectAsFormAction<
    JobineFormState,
    typeof JobineIdFormSchema,
    JobineFormErrors
  >(formState, formData, JobineIdFormSchema, archiveJobineEffect, [
    Role.manager,
  ]);
}

export async function restoreJobine(
  formState: JobineFormState,
  formData: FormData,
): Promise<JobineFormState> {
  return runEffectAsFormAction<
    JobineFormState,
    typeof JobineIdFormSchema,
    JobineFormErrors
  >(formState, formData, JobineIdFormSchema, restoreJobineEffect, [
    Role.manager,
  ]);
}
