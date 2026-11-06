import { Schema } from "effect";

import {
  DISPLAY_ORDER_MESSAGE,
  EMAIL_PATTERN,
  MAX_DISPLAY_ORDER,
  NAME_LENGTH_MESSAGE,
  PERSON_NAME_MAX_LENGTH,
} from "@/constants/accounts";
import { INVALID_EMAIL_MESSAGE } from "@/constants/auth";
import { Role } from "@/generated/prisma/enums";
import { FormState } from "@/schemas/forms.schemas";

const EmployeeIdSchema = Schema.NumberFromString.pipe(Schema.int());

const PersonNameSchema = Schema.Trim.pipe(
  Schema.minLength(1, { message: () => NAME_LENGTH_MESSAGE }),
  Schema.maxLength(PERSON_NAME_MAX_LENGTH, {
    message: () => NAME_LENGTH_MESSAGE,
  }),
);

const PersonEmailSchema = Schema.Trim.pipe(
  Schema.pattern(EMAIL_PATTERN, { message: () => INVALID_EMAIL_MESSAGE }),
);

const DisplayOrderSchema = Schema.NumberFromString.pipe(
  Schema.int({ message: () => DISPLAY_ORDER_MESSAGE }),
  Schema.between(0, MAX_DISPLAY_ORDER, {
    message: () => DISPLAY_ORDER_MESSAGE,
  }),
);

export const EditPersonFormSchema = Schema.Struct({
  employeeId: Schema.optional(EmployeeIdSchema),
  userId: Schema.optional(Schema.String),
  name: PersonNameSchema,
  statutId: Schema.optional(Schema.String),
  displayOrder: Schema.optional(DisplayOrderSchema),
  email: Schema.optional(PersonEmailSchema),
  role: Schema.optional(Schema.Enums(Role)),
});

export const ArchiveEmployeeFormSchema = Schema.Struct({
  employeeId: EmployeeIdSchema,
});

export const UserIdFormSchema = Schema.Struct({
  userId: Schema.String,
});

export type EditPersonFormData = typeof EditPersonFormSchema.Type;
export type ArchiveEmployeeFormData = typeof ArchiveEmployeeFormSchema.Type;
export type UserIdFormData = typeof UserIdFormSchema.Type;

export type AccountFormErrors = {
  employeeId?: string[];
  userId?: string[];
  name?: string[];
  statutId?: string[];
  displayOrder?: string[];
  email?: string[];
  role?: string[];
  dataValidation?: string;
  schemaValidation?: string;
};

export type AccountFormState =
  | (FormState & {
      errors?: AccountFormErrors;
      temporaryPassword?: string;
    })
  | undefined;
