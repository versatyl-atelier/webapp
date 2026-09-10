import { FormState } from "@/schemas/forms.schemas";
import { Schema } from "effect";
import { Data } from "effect";

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

export class PunchAlreadyActiveError extends Data.TaggedError(
  "PunchAlreadyActiveError",
)<{}> {}

export class NoActivePunchError extends Data.TaggedError(
  "NoActivePunchError",
)<{}> {}
