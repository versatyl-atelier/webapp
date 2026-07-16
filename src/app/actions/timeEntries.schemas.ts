import { Schema } from "effect";
import { FormState } from "./FormState";

export const EditTimeEntryFormSchema = Schema.Struct({
  timeEntryId: Schema.String,
  projectId: Schema.String,
  startTime: Schema.String,
  hours: Schema.String,
  command: Schema.Literal("save", "delete"),
});

export type EditTimeEntryFormErrors = {
  timeEntryId?: string[];
  projectId?: string[];
  startTime?: string[];
  hours?: string[];
  command?: string[];
};

export type EditTimeEntryFormState =
  | (FormState & {
      errors?: EditTimeEntryFormErrors;
    })
  | undefined;

export type Employee = {
  id: number;
  name: string;
  weeklyTarget?: number;
};
