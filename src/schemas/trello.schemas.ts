import { Data, Schema } from "effect";

import { TRELLO_ID_PATTERN } from "@/constants/trello";
import { ProjectStage, TrelloDestinationKey } from "@/generated/prisma/enums";

export class TrelloError extends Data.TaggedError("TrelloError")<{
  readonly endpoint: string;
  readonly status?: number;
  readonly summary?: string;
  readonly cause?: unknown;
}> {}

export class TrelloNotConfigured extends Data.TaggedError(
  "TrelloNotConfigured",
)<{
  readonly key: TrelloDestinationKey;
}> {}

export class TrelloSubjectMissing extends Data.TaggedError(
  "TrelloSubjectMissing",
)<{
  readonly projectId: string;
}> {}

export const TrelloBoardSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
});

export const TrelloOrganizationSchema = Schema.Struct({
  id: Schema.String,
});

export const TrelloListSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  idBoard: Schema.String,
});

export const TrelloCardSchema = Schema.Struct({
  id: Schema.String,
  idList: Schema.String,
  idBoard: Schema.String,
  closed: Schema.Boolean,
});

export const TrelloWebhookSchema = Schema.Struct({
  id: Schema.String,
  idModel: Schema.String,
  callbackURL: Schema.String,
  active: Schema.Boolean,
  consecutiveFailures: Schema.optional(Schema.Number),
});

export const TrelloAttachmentNameSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
});

export const TrelloAttachmentSchema = Schema.Struct({
  id: Schema.String,
});

const TrelloRefSchema = Schema.Struct({ id: Schema.String });

export const TrelloActionSchema = Schema.Struct({
  id: Schema.String,
  type: Schema.String,
  date: Schema.String,
  memberCreator: Schema.optional(
    Schema.Struct({ fullName: Schema.optional(Schema.String) }),
  ),
  data: Schema.Struct({
    card: Schema.optional(
      Schema.Struct({
        id: Schema.String,
        closed: Schema.optional(Schema.Boolean),
      }),
    ),
    board: Schema.optional(TrelloRefSchema),
    boardSource: Schema.optional(TrelloRefSchema),
    boardTarget: Schema.optional(TrelloRefSchema),
    list: Schema.optional(TrelloRefSchema),
    listBefore: Schema.optional(TrelloRefSchema),
    listAfter: Schema.optional(TrelloRefSchema),
    old: Schema.optional(
      Schema.Struct({ closed: Schema.optional(Schema.Boolean) }),
    ),
  }),
});

export const TrelloWebhookPayloadSchema = Schema.Struct({
  action: TrelloActionSchema,
});

export type TrelloAction = typeof TrelloActionSchema.Type;
export type TrelloBoard = typeof TrelloBoardSchema.Type;
export type TrelloList = typeof TrelloListSchema.Type;

export const TrelloIdSchema = Schema.String.pipe(
  Schema.pattern(TRELLO_ID_PATTERN),
);
export const TrelloDestinationKeySchema = Schema.Enums(TrelloDestinationKey);
export const TrelloStageSchema = Schema.Enums(ProjectStage);
export const TrelloCardRowIdSchema = Schema.Int;
