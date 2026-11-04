import { Data, Schema } from "effect";

import { DROPBOX_FILE_TAG, DROPBOX_FOLDER_TAG } from "@/constants/dropbox";

export class DropboxError extends Data.TaggedError("DropboxError")<{
  readonly endpoint: string;
  readonly status?: number;
  readonly summary?: string;
  readonly cause?: unknown;
}> {}

export const DropboxTokenSchema = Schema.Struct({
  access_token: Schema.String,
});

export const DropboxErrorBodySchema = Schema.Struct({
  error_summary: Schema.String,
});

export const DropboxEntrySchema = Schema.Struct({
  ".tag": Schema.Literal(DROPBOX_FOLDER_TAG, DROPBOX_FILE_TAG),
  id: Schema.String,
  name: Schema.String,
  path_display: Schema.String,
  path_lower: Schema.String,
  size: Schema.optional(Schema.Number),
  rev: Schema.optional(Schema.String),
  client_modified: Schema.optional(Schema.String),
});

export const DropboxRestoreSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  path_display: Schema.String,
  path_lower: Schema.String,
});

export const DropboxFolderSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  path_display: Schema.String,
  path_lower: Schema.String,
});

export const DropboxFolderResultSchema = Schema.Struct({
  metadata: DropboxFolderSchema,
});

export const DropboxDeleteSchema = Schema.Struct({
  metadata: DropboxEntrySchema,
});

export const DropboxUploadLinkSchema = Schema.Struct({
  link: Schema.String,
});

export const DropboxListSchema = Schema.Struct({
  entries: Schema.Array(DropboxEntrySchema),
  cursor: Schema.String,
  has_more: Schema.Boolean,
});

export const DropboxTemporaryLinkSchema = Schema.Struct({
  link: Schema.String,
});

export type DropboxEntry = typeof DropboxEntrySchema.Type;

export type DropboxFolder = typeof DropboxFolderSchema.Type;

export class DropboxFolderMissing extends Data.TaggedError(
  "DropboxFolderMissing",
)<{
  readonly folderId: string;
}> {}

export class DropboxNotLinked extends Data.TaggedError("DropboxNotLinked")<{
  readonly projectId: string;
}> {}
