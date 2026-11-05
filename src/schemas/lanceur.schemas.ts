import { Schema } from "effect";

import { DATE_KEY_PATTERN } from "@/constants/calendar";
import {
  LANCEUR_INVALID_DATE_MESSAGE,
  LANCEUR_COMMENT_TOO_LONG_MESSAGE,
  LANCEUR_MAX_COMMENT_LENGTH,
  LANCEUR_MAX_STORED_COMMENT_LENGTH,
  LANCEUR_MAX_OPTION_LENGTH,
  LANCEUR_MAX_PRIORITY,
  LANCEUR_OPTION_REQUIRED_MESSAGE,
} from "@/constants/lanceur";
import { LanceurOptionField } from "@/generated/prisma/enums";
import { richTextPlainLength } from "@/lib/richText";

const IdSchema = Schema.Number.pipe(Schema.int());

export const PhaseIdSchema = IdSchema;

const DateKeySchema = Schema.String.pipe(
  Schema.pattern(DATE_KEY_PATTERN, {
    message: () => LANCEUR_INVALID_DATE_MESSAGE,
  }),
);

const NullableDateSchema = Schema.NullOr(DateKeySchema);

const OptionValueSchema = Schema.Trim.pipe(
  Schema.minLength(1, { message: () => LANCEUR_OPTION_REQUIRED_MESSAGE }),
  Schema.maxLength(LANCEUR_MAX_OPTION_LENGTH),
);

const OptionSelectionSchema = Schema.Trim.pipe(
  Schema.maxLength(LANCEUR_MAX_OPTION_LENGTH),
);

export const LanceurOptionInputSchema = Schema.Struct({
  field: Schema.Enums(LanceurOptionField),
  value: OptionValueSchema,
});

export const LanceurPatchSchema = Schema.Struct({
  pdmDate: Schema.optional(NullableDateSchema),
  approvalDate: Schema.optional(NullableDateSchema),
  deliveryDate: Schema.optional(NullableDateSchema),
  price: Schema.optional(
    Schema.NullOr(Schema.Number.pipe(Schema.nonNegative())),
  ),
  isSigned: Schema.optional(Schema.Boolean),
  approvedOverride: Schema.optional(Schema.NullOr(Schema.Boolean)),
  priority: Schema.optional(
    Schema.Number.pipe(Schema.int(), Schema.between(0, LANCEUR_MAX_PRIORITY)),
  ),
  etape: Schema.optional(OptionSelectionSchema),
  installateur: Schema.optional(OptionSelectionSchema),
  deliveryComment: Schema.optional(
    Schema.String.pipe(
      Schema.maxLength(LANCEUR_MAX_STORED_COMMENT_LENGTH),
      Schema.filter(
        (value) => richTextPlainLength(value) <= LANCEUR_MAX_COMMENT_LENGTH,
        {
          message: () => LANCEUR_COMMENT_TOO_LONG_MESSAGE,
        },
      ),
    ),
  ),
  responsibleId: Schema.optional(Schema.NullOr(IdSchema)),
});

export type LanceurPatch = typeof LanceurPatchSchema.Type;
export type LanceurOptionInput = typeof LanceurOptionInputSchema.Type;

export type LanceurMutationResult = { error?: string };

export const LanceurAddTargetSchema = Schema.Struct({
  projectId: Schema.String,
  phaseId: Schema.NullOr(IdSchema),
});

export const LanceurImportEntrySchema = Schema.Struct({
  projectId: Schema.String,
  phaseId: Schema.NullOr(IdSchema),
  price: Schema.Number.pipe(Schema.positive()),
  pdmDate: NullableDateSchema,
  approvalDate: NullableDateSchema,
  deliveryDate: NullableDateSchema,
  etape: OptionSelectionSchema,
  installateur: OptionSelectionSchema,
  responsibleId: Schema.NullOr(IdSchema),
});

export const LanceurImportSchema = Schema.Array(LanceurImportEntrySchema).pipe(
  Schema.minItems(1),
);

export type LanceurAddTarget = typeof LanceurAddTargetSchema.Type;
export type LanceurImportEntry = typeof LanceurImportEntrySchema.Type;
