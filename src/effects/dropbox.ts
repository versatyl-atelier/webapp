import { Config, Duration, Effect, Option, Redacted, Schema } from "effect";

import {
  DROPBOX_API_ARG_HEADER,
  DROPBOX_API_URL,
  DROPBOX_ENDPOINTS,
  DROPBOX_FOLDER_CONFLICT_PREFIX,
  DROPBOX_FOLDER_TAG,
  FILE_THUMBNAIL_TILE_SIZE,
  DROPBOX_LIST_LIMIT,
  DROPBOX_NOT_FOLDER_PREFIX,
  DROPBOX_NOT_FOUND_PREFIX,
  DROPBOX_PATH_RESOURCE_TAG,
  DROPBOX_REFRESH_GRANT,
  DROPBOX_THUMBNAIL_URL,
  DROPBOX_TOKEN_TTL_HOURS,
  DROPBOX_UPLOAD_LINK_DURATION_SECONDS,
  DROPBOX_UPLOAD_MODE,
  THUMBNAIL_CONTENT_TYPE,
  THUMBNAIL_FORMAT,
  THUMBNAIL_MODE,
  DROPBOX_TOKEN_URL,
} from "@/constants/dropbox";
import {
  DropboxError,
  DropboxDeleteSchema,
  DropboxEntrySchema,
  DropboxErrorBodySchema,
  DropboxFolderMissing,
  DropboxFolderResultSchema,
  DropboxFolderSchema,
  DropboxListSchema,
  DropboxRestoreSchema,
  DropboxTemporaryLinkSchema,
  DropboxUploadLinkSchema,
  DropboxTokenSchema,
  type DropboxEntry,
} from "@/schemas/dropbox.schemas";

const DropboxConfig = Config.all({
  appKey: Config.string("DROPBOX_APP_KEY"),
  appSecret: Config.redacted("DROPBOX_APP_SECRET"),
  refreshToken: Config.redacted("DROPBOX_REFRESH_TOKEN"),
  rootPath: Config.string("DROPBOX_ROOT_PATH"),
});

export const dropboxRootPath = DropboxConfig.pipe(
  Effect.map(({ rootPath }) => rootPath),
);

const errorSummary = (body: string) =>
  Schema.decodeUnknownOption(Schema.parseJson(DropboxErrorBodySchema))(
    body,
  ).pipe(
    Option.map(({ error_summary }) => error_summary),
    Option.getOrElse(() => body),
  );

const dropboxFetch = Effect.fn("dropboxFetch")(function* (
  endpoint: string,
  url: string,
  init: RequestInit,
) {
  const response = yield* Effect.tryPromise({
    try: () => fetch(url, init),
    catch: (cause) => new DropboxError({ endpoint, cause }),
  });
  const body = yield* Effect.tryPromise({
    try: () => response.text(),
    catch: (cause) => new DropboxError({ endpoint, cause }),
  });
  if (!response.ok) {
    return yield* new DropboxError({
      endpoint,
      status: response.status,
      summary: errorSummary(body),
    });
  }
  return body;
});

const requestAccessToken = Effect.fn("requestDropboxAccessToken")(function* () {
  const { appKey, appSecret, refreshToken } = yield* DropboxConfig;
  const credentials = Buffer.from(
    `${appKey}:${Redacted.value(appSecret)}`,
  ).toString("base64");
  const body = yield* dropboxFetch(DROPBOX_TOKEN_URL, DROPBOX_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: DROPBOX_REFRESH_GRANT,
      refresh_token: Redacted.value(refreshToken),
    }),
  });
  const { access_token } = yield* Schema.decodeUnknown(
    Schema.parseJson(DropboxTokenSchema),
  )(body);
  return access_token;
});

const cachedAccessToken = Effect.runSync(
  Effect.cachedWithTTL(
    requestAccessToken(),
    Duration.hours(DROPBOX_TOKEN_TTL_HOURS),
  ),
);

const dropboxRpc = <A, I>(
  endpoint: string,
  payload: object,
  schema: Schema.Schema<A, I>,
) =>
  Effect.gen(function* () {
    const token = yield* cachedAccessToken;
    const body = yield* dropboxFetch(
      endpoint,
      `${DROPBOX_API_URL}/${endpoint}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );
    return yield* Schema.decodeUnknown(Schema.parseJson(schema))(body);
  });

export const isDropboxNotFound = (error: unknown): boolean =>
  error instanceof DropboxError &&
  ((error.summary?.startsWith(DROPBOX_NOT_FOUND_PREFIX) ?? false) ||
    (error.summary?.startsWith(DROPBOX_NOT_FOLDER_PREFIX) ?? false));

export const createDropboxFolder = Effect.fn("createDropboxFolder")(function* (
  path: string,
) {
  yield* Effect.annotateLogsScoped({ dropboxPath: path });
  const created = yield* dropboxRpc(
    DROPBOX_ENDPOINTS.createFolder,
    { path, autorename: false },
    DropboxFolderResultSchema,
  ).pipe(
    Effect.map(({ metadata }) => metadata),
    Effect.catchIf(
      (error) =>
        error instanceof DropboxError &&
        (error.summary?.startsWith(DROPBOX_FOLDER_CONFLICT_PREFIX) ?? false),
      () =>
        dropboxRpc(DROPBOX_ENDPOINTS.metadata, { path }, DropboxFolderSchema),
    ),
  );
  return created;
});

export const resolveDropboxFolder = Effect.fn("resolveDropboxFolder")(
  function* (folderId: string) {
    return yield* dropboxRpc(
      DROPBOX_ENDPOINTS.metadata,
      { path: folderId },
      DropboxFolderSchema,
    ).pipe(
      Effect.catchIf(isDropboxNotFound, () =>
        Effect.fail(new DropboxFolderMissing({ folderId })),
      ),
    );
  },
);

export const listDropboxFolder = Effect.fn("listDropboxFolder")(function* (
  path: string,
) {
  yield* Effect.annotateLogsScoped({ dropboxPath: path });
  let page = yield* dropboxRpc(
    DROPBOX_ENDPOINTS.listFolder,
    { path, limit: DROPBOX_LIST_LIMIT },
    DropboxListSchema,
  );
  const entries: DropboxEntry[] = [...page.entries];
  while (page.has_more) {
    page = yield* dropboxRpc(
      DROPBOX_ENDPOINTS.listFolderContinue,
      { cursor: page.cursor },
      DropboxListSchema,
    );
    entries.push(...page.entries);
  }
  return entries;
});

export const listDropboxSubfolders = Effect.fn("listDropboxSubfolders")(
  function* (path: string) {
    const entries = yield* listDropboxFolder(path);
    return entries
      .filter((entry) => entry[".tag"] === DROPBOX_FOLDER_TAG)
      .map(({ name }) => name);
  },
);

export const listDropboxChildFolders = Effect.fn("listDropboxChildFolders")(
  function* (path: string) {
    const entries = yield* listDropboxFolder(path);
    return entries
      .filter((entry) => entry[".tag"] === DROPBOX_FOLDER_TAG)
      .map(({ id, name }) => ({ id, name }));
  },
);

export const moveDropboxFolder = Effect.fn("moveDropboxFolder")(function* (
  from: string,
  to: string,
) {
  yield* Effect.annotateLogsScoped({ dropboxFrom: from, dropboxTo: to });
  const { metadata } = yield* dropboxRpc(
    DROPBOX_ENDPOINTS.move,
    { from_path: from, to_path: to, autorename: false },
    DropboxFolderResultSchema,
  );
  return metadata;
});

export const renameDropboxFolder = Effect.fn("renameDropboxFolder")(function* (
  folderId: string,
  name: string,
) {
  const folder = yield* resolveDropboxFolder(folderId);
  const parent = folder.path_display.slice(
    0,
    folder.path_display.length - folder.name.length,
  );
  if (folder.name.toLowerCase() === name.toLowerCase()) {
    return folder;
  }
  return yield* moveDropboxFolder(folder.path_display, `${parent}${name}`);
});

export const dropboxTemporaryLink = Effect.fn("dropboxTemporaryLink")(
  function* (path: string) {
    const { link } = yield* dropboxRpc(
      DROPBOX_ENDPOINTS.temporaryLink,
      { path },
      DropboxTemporaryLinkSchema,
    );
    return link;
  },
);

export const getDropboxThumbnail = Effect.fn("getDropboxThumbnail")(function* (
  fileId: string,
  size: string = FILE_THUMBNAIL_TILE_SIZE,
) {
  const token = yield* cachedAccessToken;
  const response = yield* Effect.tryPromise({
    try: () =>
      fetch(DROPBOX_THUMBNAIL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          [DROPBOX_API_ARG_HEADER]: JSON.stringify({
            resource: { ".tag": DROPBOX_PATH_RESOURCE_TAG, path: fileId },
            format: THUMBNAIL_FORMAT,
            size,
            mode: THUMBNAIL_MODE,
          }),
        },
      }),
    catch: (cause) =>
      new DropboxError({ endpoint: DROPBOX_THUMBNAIL_URL, cause }),
  });
  if (!response.ok) {
    return yield* new DropboxError({
      endpoint: DROPBOX_THUMBNAIL_URL,
      status: response.status,
      summary: yield* Effect.promise(() => response.text()),
    });
  }
  const bytes = yield* Effect.tryPromise({
    try: () => response.arrayBuffer(),
    catch: (cause) =>
      new DropboxError({ endpoint: DROPBOX_THUMBNAIL_URL, cause }),
  });
  return { bytes, contentType: THUMBNAIL_CONTENT_TYPE };
});

export const getDropboxMetadata = Effect.fn("getDropboxMetadata")(function* (
  path: string,
) {
  return yield* dropboxRpc(
    DROPBOX_ENDPOINTS.metadata,
    { path },
    DropboxEntrySchema,
  );
});

export const deleteDropboxPath = Effect.fn("deleteDropboxPath")(function* (
  path: string,
) {
  yield* Effect.annotateLogsScoped({ dropboxPath: path });
  const { metadata } = yield* dropboxRpc(
    DROPBOX_ENDPOINTS.delete,
    { path },
    DropboxDeleteSchema,
  );
  return metadata;
});

export const restoreDropboxFile = Effect.fn("restoreDropboxFile")(function* (
  path: string,
  rev: string,
) {
  yield* Effect.annotateLogsScoped({ dropboxPath: path });
  return yield* dropboxRpc(
    DROPBOX_ENDPOINTS.restore,
    { path, rev },
    DropboxRestoreSchema,
  );
});

export const createDropboxUploadLink = Effect.fn("createDropboxUploadLink")(
  function* (path: string) {
    yield* Effect.annotateLogsScoped({ dropboxPath: path });
    const { link } = yield* dropboxRpc(
      DROPBOX_ENDPOINTS.uploadLink,
      {
        commit_info: {
          path,
          mode: DROPBOX_UPLOAD_MODE,
          autorename: true,
          mute: false,
        },
        duration: DROPBOX_UPLOAD_LINK_DURATION_SECONDS,
      },
      DropboxUploadLinkSchema,
    );
    return link;
  },
);
