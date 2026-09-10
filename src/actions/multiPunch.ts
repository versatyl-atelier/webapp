"use server";

import "server-only";

import { Role } from "@/generated/prisma/client";
import {
  type StartMultiPunchFormState,
  type EndMultiPunchFormState,
  StartMultiPunchSchema,
  EndMultiPunchSchema,
  EndMultiPunchFormErrors,
  StartMultiPunchFormErrors,
} from "@/schemas/multiPunch.schemas";
import { runEffectAsFormAction } from "@/lib/effect";
import { cachedGetter } from "@/lib/effect";
import {
  endMultiPunchEffect,
  getActivePunchEffect,
  startMultiPunchEffect,
} from "@/effects/multipunch";

export async function startMultiPunch(
  formState: StartMultiPunchFormState,
  formData: FormData,
): Promise<StartMultiPunchFormState> {
  return runEffectAsFormAction<
    StartMultiPunchFormState,
    typeof StartMultiPunchSchema,
    StartMultiPunchFormErrors
  >(
    formState,
    formData,
    StartMultiPunchSchema,
    startMultiPunchEffect,
    Role.employee,
  );
}

export async function endMultiPunch(
  formState: EndMultiPunchFormState,
  formData: FormData,
): Promise<EndMultiPunchFormState> {
  return runEffectAsFormAction<
    EndMultiPunchFormState,
    typeof EndMultiPunchSchema,
    EndMultiPunchFormErrors
  >(
    formState,
    formData,
    EndMultiPunchSchema,
    endMultiPunchEffect,
    Role.employee,
  );
}

export const getActivePunch = cachedGetter(getActivePunchEffect, Role.employee);
