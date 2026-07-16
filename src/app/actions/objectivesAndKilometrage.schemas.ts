import { Schema } from "effect";
import { FormState } from "./FormState";

export const ObjectivesAndKilometrageFormSchema = Schema.Struct({
  employeeId: Schema.String,
  weekStart: Schema.String,
  objective: Schema.String,
  kilometrage: Schema.String,
});

export type ObjectivesAndKilometrageFormErrors = {
  employeeId?: string[];
  weekStart?: string[];
  objective?: string[];
  kilometrage?: string[];
};

export type ObjectivesAndKilometrageFormState =
  | (FormState & {
      errors?: ObjectivesAndKilometrageFormErrors;
    })
  | undefined;
