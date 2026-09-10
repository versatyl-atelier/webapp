"use server";

import "server-only";

import {
  type ObjectivesAndKilometrageFormState,
  ObjectivesAndKilometrageFormErrors,
  ObjectivesAndKilometrageFormSchema,
} from "@/schemas/objectivesAndKilometrage.schemas";
import { Role } from "@/generated/prisma/enums";
import { runEffectAsFormAction } from "@/lib/effect";
import { updateObjectivesAndKilometrageEffect } from "@/effects/objectivesAndKilometrage";

export async function updateObjectivesAndKilometrage(
  formState: ObjectivesAndKilometrageFormState,
  formData: FormData,
): Promise<ObjectivesAndKilometrageFormState> {
  return runEffectAsFormAction<
    ObjectivesAndKilometrageFormState,
    typeof ObjectivesAndKilometrageFormSchema,
    ObjectivesAndKilometrageFormErrors
  >(
    formState,
    formData,
    ObjectivesAndKilometrageFormSchema,
    updateObjectivesAndKilometrageEffect,
    Role.employee,
  );
}
