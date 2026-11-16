import { Schema } from "effect";

import {
  JOBINE_DESCRIPTION_LENGTH_MESSAGE,
  JOBINE_DESCRIPTION_MAX_LENGTH,
  JOBINE_NAME_LENGTH_MESSAGE,
  JOBINE_NAME_MAX_LENGTH,
  JOBINE_NAME_MIN_LENGTH,
} from "@/constants/jobines";
import { FormState, HexColorSchema } from "@/schemas/forms.schemas";

const JobineIdSchema = Schema.NumberFromString.pipe(Schema.int());

export const JobineNameSchema = Schema.Trim.pipe(
  Schema.minLength(JOBINE_NAME_MIN_LENGTH, {
    message: () => JOBINE_NAME_LENGTH_MESSAGE,
  }),
  Schema.maxLength(JOBINE_NAME_MAX_LENGTH, {
    message: () => JOBINE_NAME_LENGTH_MESSAGE,
  }),
);

export const JobineDescriptionSchema = Schema.Trim.pipe(
  Schema.maxLength(JOBINE_DESCRIPTION_MAX_LENGTH, {
    message: () => JOBINE_DESCRIPTION_LENGTH_MESSAGE,
  }),
);

const JobineFields = {
  name: JobineNameSchema,
  description: JobineDescriptionSchema,
  color: HexColorSchema,
};

export const AddJobineFormSchema = Schema.Struct(JobineFields);

export const EditJobineFormSchema = Schema.Struct({
  jobineId: JobineIdSchema,
  ...JobineFields,
});

export const JobineIdFormSchema = Schema.Struct({
  jobineId: JobineIdSchema,
});

export type AddJobineFormData = typeof AddJobineFormSchema.Type;
export type EditJobineFormData = typeof EditJobineFormSchema.Type;
export type JobineIdFormData = typeof JobineIdFormSchema.Type;

export type JobineFormErrors = {
  jobineId?: string[];
  name?: string[];
  description?: string[];
  color?: string[];
  dataValidation?: string;
  schemaValidation?: string;
};

export type JobineFormState =
  | (FormState & {
      errors?: JobineFormErrors;
    })
  | undefined;
