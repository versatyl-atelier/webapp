"use server";

import "server-only";

import { cachedGetter, runEffectAsFormAction } from "@/lib/effect";

import {
  type FreezeWeekFormState,
  type FreezeWeekFormErrors,
  FreezeWeekFormSchema,
} from "@/schemas/frozenWeeks.schemas";
import { Role } from "@/generated/prisma/client";
import { freezeWeekEffect, getFrozenWeeksEffect } from "@/effects/frozenWeeks";

export const getFrozenWeeks = cachedGetter(getFrozenWeeksEffect, Role.employee);

export const freezeWeek = async (
  formState: FreezeWeekFormState,
  formData: FormData,
): Promise<FreezeWeekFormState> => {
  return runEffectAsFormAction<
    FreezeWeekFormState,
    typeof FreezeWeekFormSchema,
    FreezeWeekFormErrors
  >(formState, formData, FreezeWeekFormSchema, freezeWeekEffect);
};
