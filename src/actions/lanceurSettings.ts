"use server";

import "server-only";

import { refresh } from "next/cache";

import { Role } from "@/generated/prisma/enums";
import {
  addClosureEffect,
  getClosuresEffect,
  removeClosureEffect,
  savePlanSettingsEffect,
} from "@/effects/lanceurSettings";
import {
  cachedGetter,
  protectedEffect,
  runEffectAsFormAction,
} from "@/lib/effect";
import {
  ClosureFormSchema,
  PlanSettingsFormSchema,
  type ClosureFormErrors,
  type ClosureFormState,
  type PlanSettingsFormErrors,
  type PlanSettingsFormState,
} from "@/schemas/lanceurSettings.schemas";

export const getClosures = cachedGetter(getClosuresEffect, [Role.manager]);

const removeClosureMutation = protectedEffect(
  removeClosureEffect,
  [Role.manager],
  "mutation",
);

export async function savePlanSettings(
  formState: PlanSettingsFormState,
  formData: FormData,
): Promise<PlanSettingsFormState> {
  return runEffectAsFormAction<
    PlanSettingsFormState,
    typeof PlanSettingsFormSchema,
    PlanSettingsFormErrors
  >(formState, formData, PlanSettingsFormSchema, savePlanSettingsEffect, [
    Role.manager,
  ]);
}

export async function addClosure(
  formState: ClosureFormState,
  formData: FormData,
): Promise<ClosureFormState> {
  return runEffectAsFormAction<
    ClosureFormState,
    typeof ClosureFormSchema,
    ClosureFormErrors
  >(formState, formData, ClosureFormSchema, addClosureEffect, [Role.manager]);
}

export async function removeClosure(closureId: number): Promise<void> {
  await removeClosureMutation(closureId);
  refresh();
}
