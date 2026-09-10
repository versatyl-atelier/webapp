import { Schema } from "effect";
import { FormState } from "@/schemas/forms.schemas";
import { Data } from "effect";

export const WEEK_FROZEN_MESSAGE =
  "Cette semaine est gelée. Un gestionnaire doit la dégeler pour permettre des modifications.";

export class WeekFrozenError extends Data.TaggedError("WeekFrozenError")<{
  readonly employeeId: number;
  readonly weekStart: Date;
}> {}

export const FreezeWeekFormSchema = Schema.Struct({
  employeeId: Schema.String,
  weekStart: Schema.String,
  weekTotal: Schema.String,
  objective: Schema.String,
  frozen: Schema.String,
});

export type FreezeWeekFormErrors = {
  employeeId?: string[];
  weekStart?: string[];
  weekTotal?: string[];
  objective?: string[];
  dataValidation?: string;
  schemaValidation?: string;
};

export type FreezeWeekFormState =
  | (FormState & {
      errors?: FreezeWeekFormErrors;
    })
  | undefined;

export const FrozenWeekSchema = Schema.Struct({
  employeeId: Schema.Int,
  weekStart: Schema.Date,
  weekTotal: Schema.Number,
  objective: Schema.Number,
  isDeleted: Schema.optionalWith(Schema.Boolean, { default: () => false }),
  deletedAt: Schema.optional(Schema.NullOr(Schema.Date)),
  deletedBy: Schema.optional(Schema.NullOr(Schema.Int)),
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
});

export type FrozenWeek = Schema.Schema.Type<typeof FrozenWeekSchema>;
