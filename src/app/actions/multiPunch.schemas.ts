import { FormState } from "./FormState";
import { Schema } from "effect";

const ProjectIdsFromJson = Schema.parseJson(
  Schema.Array(Schema.String).pipe(
    Schema.minItems(1, { message: () => "Au moins un projet est requis" }),
  ),
);

export const StartMultiPunchSchema = Schema.Struct({
  employeeId: Schema.String,
  projectIds: ProjectIdsFromJson,
});

enum Command {
  End = "end",
  Cancel = "cancel",
}

export const EndMultiPunchSchema = Schema.Struct({
  employeeId: Schema.String,
  command: Schema.Enums(Command),
});

export type StartMultiPunchFormErrors = {
  employeeId?: string[];
  projectIds?: string[];
};

export type StartMultiPunchFormState =
  | (FormState & {
      errors?: StartMultiPunchFormErrors;
    })
  | undefined;

export type EndMultiPunchFormErrors = {
  employeeId?: string[];
  command?: string[];
};

export type EndMultiPunchFormState =
  | (FormState & {
      errors?: EndMultiPunchFormErrors;
    })
  | undefined;
