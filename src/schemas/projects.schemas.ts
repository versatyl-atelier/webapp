import { Schema } from "effect";

import {
  DROPBOX_FILE_ID_PATTERN,
  FILE_NAME_REQUIRED_MESSAGE,
} from "@/constants/dropbox";
import {
  COVER_IMAGE_FIELD,
  COVER_INVALID_TYPE_MESSAGE,
  COVER_MAX_BYTES,
  COVER_MIME_TYPE,
  COVER_PIECE_FIELD,
  COVER_TOO_LARGE_MESSAGE,
  COVER_ZOOM_MAX,
  COVER_ZOOM_MIN,
  PERCENT,
} from "@/constants/projectFiles";
import {
  EMAIL_PATTERN,
  HEX_COLOR_PATTERN,
  INVALID_COLOR_MESSAGE,
  INVALID_CABINET_COUNT_MESSAGE,
  INVALID_EMAIL_MESSAGE,
  NO_PROJECT_STAGE_VALUE,
  NOTE_BODY_REQUIRED_MESSAGE,
  PROJECT_NAME_REQUIRED_MESSAGE,
} from "@/constants/projects";
import { ProjectStage } from "@/generated/prisma/enums";
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

const NoStageAsNullSchema = Schema.Literal(NO_PROJECT_STAGE_VALUE).pipe(
  Schema.transform(Schema.Null, {
    strict: true,
    decode: () => null,
    encode: () => NO_PROJECT_STAGE_VALUE,
  }),
);

const EmailSchema = Schema.Trim.pipe(
  Schema.filter(
    (value) => !value || EMAIL_PATTERN.test(value) || INVALID_EMAIL_MESSAGE,
  ),
);

export const ContactFormSchema = Schema.Struct({
  projectId: Schema.String,
  id: Schema.optional(IdFromFormSchema),
  role: Schema.Trim,
  name: Schema.Trim,
  company: Schema.Trim,
  phone: Schema.Trim,
  email: EmailSchema,
  address: Schema.Trim,
});

export type ContactFormData = typeof ContactFormSchema.Type;

export type ContactFormErrors = {
  projectId?: string[];
  id?: string[];
  role?: string[];
  name?: string[];
  company?: string[];
  phone?: string[];
  email?: string[];
  address?: string[];
  dataValidation?: string;
  schemaValidation?: string;
};

export type ContactFormState =
  | (FormState & {
      errors?: ContactFormErrors;
    })
  | undefined;

export const ProjectLocationFormSchema = Schema.Struct({
  projectId: Schema.String,
  color: Schema.String.pipe(
    Schema.pattern(HEX_COLOR_PATTERN, { message: () => INVALID_COLOR_MESSAGE }),
  ),
  address: Schema.Trim,
});

export type ProjectLocationFormData = typeof ProjectLocationFormSchema.Type;

export type ProjectLocationFormErrors = {
  projectId?: string[];
  color?: string[];
  address?: string[];
  dataValidation?: string;
  schemaValidation?: string;
};

export type ProjectLocationFormState =
  | (FormState & {
      errors?: ProjectLocationFormErrors;
    })
  | undefined;

export const ProjectHeaderFormSchema = Schema.Struct({
  projectId: Schema.String,
  name: Schema.Trim.pipe(
    Schema.minLength(1, { message: () => PROJECT_NAME_REQUIRED_MESSAGE }),
  ),
  stage: Schema.Union(NoStageAsNullSchema, Schema.Enums(ProjectStage)),
});

export type ProjectHeaderFormData = typeof ProjectHeaderFormSchema.Type;

export type ProjectHeaderFormErrors = {
  projectId?: string[];
  name?: string[];
  stage?: string[];
  dataValidation?: string;
  schemaValidation?: string;
};

export type ProjectHeaderFormState =
  | (FormState & {
      errors?: ProjectHeaderFormErrors;
    })
  | undefined;

export const ProjectCreateFormSchema = Schema.Struct({
  name: Schema.Trim.pipe(
    Schema.minLength(1, { message: () => PROJECT_NAME_REQUIRED_MESSAGE }),
  ),
});

export type ProjectCreateFormData = typeof ProjectCreateFormSchema.Type;

export type ProjectCreateFormErrors = {
  name?: string[];
  dataValidation?: string;
  schemaValidation?: string;
};

export type ProjectCreateFormState =
  | (FormState & {
      errors?: ProjectCreateFormErrors;
      projectId?: string;
    })
  | undefined;

export const PieceFormSchema = Schema.Struct({
  projectId: Schema.String,
  id: Schema.optional(IdFromFormSchema),
  phaseId: OptionalIdFromFormSchema,
  type: Schema.Trim,
  description: Schema.Trim,
  caissonMaterial: Schema.Trim,
  cladding: Schema.parseJson(Schema.mutable(Schema.Array(Schema.Trim))).pipe(
    Schema.transform(Schema.mutable(Schema.Array(Schema.String)), {
      strict: true,
      decode: (values) => values.filter(Boolean),
      encode: (values) => values,
    }),
  ),
  countertop: Schema.Trim,
  drawers: Schema.Trim,
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
  description?: string[];
  caissonMaterial?: string[];
  cladding?: string[];
  countertop?: string[];
  drawers?: string[];
  finish?: string[];
  cabinetCount?: string[];
  dataValidation?: string;
  schemaValidation?: string;
};

export type PieceFormState =
  | (FormState & {
      errors?: PieceFormErrors;
      pieceId?: number;
    })
  | undefined;

const NoteBodySchema = Schema.Trim.pipe(
  Schema.minLength(1, { message: () => NOTE_BODY_REQUIRED_MESSAGE }),
);

export const NoteFormSchema = Schema.Struct({
  projectId: Schema.String,
  phaseId: OptionalIdFromFormSchema,
  body: NoteBodySchema,
});

export type NoteFormData = typeof NoteFormSchema.Type;

export type NoteFormErrors = {
  projectId?: string[];
  phaseId?: string[];
  body?: string[];
  dataValidation?: string;
  schemaValidation?: string;
};

export type NoteFormState =
  | (FormState & {
      errors?: NoteFormErrors;
    })
  | undefined;

export const NoteEditFormSchema = Schema.Struct({
  id: IdFromFormSchema,
  body: NoteBodySchema,
});

export type NoteEditFormData = typeof NoteEditFormSchema.Type;

export type NoteEditFormErrors = {
  id?: string[];
  body?: string[];
  dataValidation?: string;
  schemaValidation?: string;
};

export type NoteEditFormState =
  | (FormState & {
      errors?: NoteEditFormErrors;
    })
  | undefined;

export const PhaseIdSchema = Schema.Int;
export const PieceIdSchema = Schema.Int;
export const NoteIdSchema = Schema.Int;
export const PhaseNameSchema = Schema.Trim.pipe(Schema.minLength(1));
export const FileSectionIdSchema = Schema.Int;
export const FileSectionNameSchema = Schema.Trim.pipe(Schema.minLength(1));
export const ProjectIdSchema = Schema.String.pipe(Schema.minLength(1));
export const ProjectIdsSchema = Schema.Array(ProjectIdSchema);
export const ContactIdSchema = Schema.Int;
export const DropboxFileIdSchema = Schema.String.pipe(
  Schema.pattern(DROPBOX_FILE_ID_PATTERN),
);
export const FileNameSchema = Schema.Trim.pipe(
  Schema.minLength(1, { message: () => FILE_NAME_REQUIRED_MESSAGE }),
);
export const FileSizeSchema = Schema.Number.pipe(
  Schema.int(),
  Schema.nonNegative(),
);
export const CoverFramingSchema = Schema.Struct({
  x: Schema.Number.pipe(Schema.between(0, PERCENT)),
  y: Schema.Number.pipe(Schema.between(0, PERCENT)),
  zoom: Schema.Number.pipe(Schema.between(COVER_ZOOM_MIN, COVER_ZOOM_MAX)),
});

export const CoverImageFormSchema = Schema.Struct({
  [COVER_PIECE_FIELD]: IdFromFormSchema,
  [COVER_IMAGE_FIELD]: Schema.instanceOf(File).pipe(
    Schema.filter(
      (file) => file.type === COVER_MIME_TYPE || COVER_INVALID_TYPE_MESSAGE,
    ),
    Schema.filter(
      (file) =>
        (file.size > 0 && file.size <= COVER_MAX_BYTES) ||
        COVER_TOO_LARGE_MESSAGE,
    ),
  ),
});

export type CoverImageFormData = typeof CoverImageFormSchema.Type;

export type CoverImageFormErrors = {
  [COVER_PIECE_FIELD]?: string[];
  [COVER_IMAGE_FIELD]?: string[];
  dataValidation?: string;
  schemaValidation?: string;
};

export type CoverImageFormState =
  | (FormState & {
      errors?: CoverImageFormErrors;
    })
  | undefined;
