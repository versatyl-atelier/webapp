import { Schema } from "effect";

import { DATE_KEY_PATTERN } from "@/constants/calendar";
import { LANCEUR_INVALID_DATE_MESSAGE } from "@/constants/lanceur";
import {
  CLOSURE_REASON_MAX_LENGTH,
  INVALID_CAPACITY_MESSAGE,
  INVALID_MIN_DAYS_MESSAGE,
  INVALID_SHARE_MESSAGE,
  MAX_WEEK_SHARE_MAX,
  MAX_WEEK_SHARE_MIN,
  MIN_PROD_DAYS_MAX,
} from "@/constants/lanceurSettings";
import { FormState } from "@/schemas/forms.schemas";

export const PlanSettingsFormSchema = Schema.Struct({
  capacityRatio: Schema.NumberFromString.pipe(
    Schema.positive({ message: () => INVALID_CAPACITY_MESSAGE }),
  ),
  minProdDays: Schema.NumberFromString.pipe(
    Schema.int({ message: () => INVALID_MIN_DAYS_MESSAGE }),
    Schema.between(1, MIN_PROD_DAYS_MAX, {
      message: () => INVALID_MIN_DAYS_MESSAGE,
    }),
  ),
  maxWeekShare: Schema.NumberFromString.pipe(
    Schema.between(MAX_WEEK_SHARE_MIN, MAX_WEEK_SHARE_MAX, {
      message: () => INVALID_SHARE_MESSAGE,
    }),
  ),
});

export const ClosureFormSchema = Schema.Struct({
  date: Schema.String.pipe(
    Schema.pattern(DATE_KEY_PATTERN, {
      message: () => LANCEUR_INVALID_DATE_MESSAGE,
    }),
  ),
  reason: Schema.Trim.pipe(Schema.maxLength(CLOSURE_REASON_MAX_LENGTH)),
});

export const ClosureIdSchema = Schema.Number.pipe(Schema.int());

export type PlanSettingsFormData = typeof PlanSettingsFormSchema.Type;
export type ClosureFormData = typeof ClosureFormSchema.Type;

export type PlanSettingsFormErrors = {
  capacityRatio?: string[];
  minProdDays?: string[];
  maxWeekShare?: string[];
  dataValidation?: string;
  schemaValidation?: string;
};

export type PlanSettingsFormState =
  (FormState & { errors?: PlanSettingsFormErrors }) | undefined;

export type ClosureFormErrors = {
  date?: string[];
  reason?: string[];
  dataValidation?: string;
  schemaValidation?: string;
};

export type ClosureFormState =
  (FormState & { errors?: ClosureFormErrors }) | undefined;
