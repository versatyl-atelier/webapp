import { Schema } from "effect";

import {
  EMAIL_PATTERN,
  HEX_COLOR_PATTERN,
  INVALID_COLOR_MESSAGE,
  INVALID_CABINET_COUNT_MESSAGE,
  INVALID_EMAIL_MESSAGE,
  PROJECT_NAME_REQUIRED_MESSAGE,
} from "@/constants/projects";
import { FormState } from "@/schemas/forms.schemas";

const IdFromFormSchema = Schema.NumberFromString.pipe(Schema.int());

const EmptyAsNullSchema = Schema.Literal("").pipe(
  Schema.transform(Schema.Null, {
    strict: true,
    decode: () => null,
    encode: () => "" as const,
  }),
);

const OptionalIdFromFormSchema = Schema.Union(
  EmptyAsNullSchema,
  IdFromFormSchema,
);

const EmailSchema = Schema.Trim.pipe(
  Schema.filter(
    (value) => !value || EMAIL_PATTERN.test(value) || INVALID_EMAIL_MESSAGE,
  ),
);

export const ContactSchema = Schema.Struct({
  role: Schema.Trim,
  name: Schema.Trim,
  company: Schema.Trim,
  phone: Schema.Trim,
  email: EmailSchema,
});

export const ProjectHeaderFormSchema = Schema.Struct({
  projectId: Schema.String,
  name: Schema.Trim.pipe(
    Schema.minLength(1, { message: () => PROJECT_NAME_REQUIRED_MESSAGE }),
  ),
  color: Schema.String.pipe(
    Schema.pattern(HEX_COLOR_PATTERN, { message: () => INVALID_COLOR_MESSAGE }),
  ),
  address: Schema.Trim,
});

export type ProjectHeaderFormData = typeof ProjectHeaderFormSchema.Type;

export type ProjectHeaderFormErrors = {
  projectId?: string[];
  name?: string[];
  color?: string[];
  address?: string[];
  dataValidation?: string;
  schemaValidation?: string;
};

export type ProjectHeaderFormState =
  | (FormState & {
      errors?: ProjectHeaderFormErrors;
    })
  | undefined;

export const ProjectContactsFormSchema = Schema.Struct({
  projectId: Schema.String,
  contacts: Schema.parseJson(Schema.Array(ContactSchema)),
});

export type ProjectContactsFormData = typeof ProjectContactsFormSchema.Type;

export type ProjectContactsFormErrors = {
  projectId?: string[];
  contacts?: string[];
  [contactField: `contacts.${number}.${string}`]: string[] | undefined;
  dataValidation?: string;
  schemaValidation?: string;
};

export type ProjectContactsFormState =
  | (FormState & {
      errors?: ProjectContactsFormErrors;
    })
  | undefined;

export const PieceFormSchema = Schema.Struct({
  projectId: Schema.String,
  id: Schema.optional(IdFromFormSchema),
  phaseId: OptionalIdFromFormSchema,
  type: Schema.Trim,
  caissonMaterial: Schema.Trim,
  cladding: Schema.Trim,
  doors: Schema.Trim,
  drawers: Schema.Trim,
  hardware: Schema.Trim,
  finish: Schema.Trim,
  cabinetCount: Schema.Union(
    EmptyAsNullSchema,
    IdFromFormSchema.pipe(
      Schema.nonNegative({ message: () => INVALID_CABINET_COUNT_MESSAGE }),
    ),
  ).annotations({ message: () => INVALID_CABINET_COUNT_MESSAGE }),
});

export type PieceFormData = typeof PieceFormSchema.Type;

export type PieceFormErrors = {
  projectId?: string[];
  id?: string[];
  phaseId?: string[];
  type?: string[];
  caissonMaterial?: string[];
  cladding?: string[];
  doors?: string[];
  drawers?: string[];
  hardware?: string[];
  finish?: string[];
  cabinetCount?: string[];
  dataValidation?: string;
  schemaValidation?: string;
};

export type PieceFormState =
  | (FormState & {
      errors?: PieceFormErrors;
    })
  | undefined;

export const PhaseIdSchema = Schema.Int;
export const PieceIdSchema = Schema.Int;
export const PhaseNameSchema = Schema.Trim.pipe(Schema.minLength(1));
