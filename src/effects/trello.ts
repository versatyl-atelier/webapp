import { Config, Effect, Redacted, Schema } from "effect";

import {
  TRELLO_API_URL,
  TRELLO_AUTH_SCHEME,
  TRELLO_CONSUMER_KEY_PARAM,
  TRELLO_COVER_FILE_NAME,
  TRELLO_COLLATION_LOCALE,
  TRELLO_FIELDS_ID,
  TRELLO_FIELDS_LIST,
  TRELLO_FIELDS_NAME,
  TRELLO_FILTER_OPEN,
  TRELLO_METHODS,
  TRELLO_NOT_FOUND_STATUS,
  TRELLO_PATHS,
  TRELLO_POSITION_BOTTOM,
  TRELLO_QUERY_STRING_PREFIX,
  TRELLO_TOKEN_PARAM,
  TRELLO_WEBHOOK_DESCRIPTION,
  TRELLO_WEBHOOK_EXISTS_PATTERN,
  TRELLO_WEBHOOK_PATH,
} from "@/constants/trello";
import { webhookCallbackUrl } from "@/lib/trello";
import {
  TrelloAttachmentNameSchema,
  TrelloAttachmentSchema,
  TrelloBoardSchema,
  TrelloCardSchema,
  TrelloError,
  TrelloListSchema,
  TrelloOrganizationSchema,
  TrelloWebhookSchema,
} from "@/schemas/trello.schemas";

const TrelloConfig = Config.all({
  key: Config.string("TRELLO_KEY"),
  token: Config.redacted("TRELLO_TOKEN"),
});

const trelloAppUrl = Config.string("BETTER_AUTH_URL");

export const trelloWebhookSecret = Config.redacted("TRELLO_SECRET");

export const trelloCallbackUrl = trelloAppUrl.pipe(
  Effect.map((baseUrl) => webhookCallbackUrl(baseUrl)),
);

export const trelloAppLink = (path: string) =>
  trelloAppUrl.pipe(Effect.map((baseUrl) => new URL(path, baseUrl).toString()));

type Params = Record<string, string | number | boolean | undefined>;

const query = (params: Params) => {
  const search = new URLSearchParams();
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined) {
      search.set(name, String(value));
    }
  }
  return search;
};

const trelloFetch = Effect.fn("trelloFetch")(function* (
  method: string,
  path: string,
  params: Params,
  body?: FormData,
) {
  const { key, token } = yield* TrelloConfig;
  const endpoint = `${method} ${path}`;
  const search = query(params);
  const url = `${TRELLO_API_URL}${path}${search.size > 0 ? `${TRELLO_QUERY_STRING_PREFIX}${search}` : ""}`;
  const response = yield* Effect.tryPromise({
    try: () =>
      fetch(url, {
        method,
        body,
        headers: {
          Authorization: `${TRELLO_AUTH_SCHEME} ${TRELLO_CONSUMER_KEY_PARAM}="${key}", ${TRELLO_TOKEN_PARAM}="${Redacted.value(token)}"`,
        },
      }),
    catch: (cause) => new TrelloError({ endpoint, cause }),
  });
  const text = yield* Effect.tryPromise({
    try: () => response.text(),
    catch: (cause) => new TrelloError({ endpoint, cause }),
  });
  if (!response.ok) {
    return yield* new TrelloError({
      endpoint,
      status: response.status,
      summary: text,
    });
  }
  return text;
});

const trelloRequest = <A, I>(
  method: string,
  path: string,
  params: Params,
  schema: Schema.Schema<A, I>,
  body?: FormData,
) =>
  trelloFetch(method, path, params, body).pipe(
    Effect.flatMap((text) =>
      Schema.decodeUnknown(Schema.parseJson(schema))(text),
    ),
  );

export const isTrelloNotFound = (error: unknown): boolean =>
  error instanceof TrelloError && error.status === TRELLO_NOT_FOUND_STATUS;

const boardsParams = { filter: TRELLO_FILTER_OPEN, fields: TRELLO_FIELDS_NAME };

export const listTrelloBoards = Effect.fn("listTrelloBoards")(function* () {
  const own = yield* trelloRequest(
    TRELLO_METHODS.get,
    TRELLO_PATHS.boards,
    boardsParams,
    Schema.Array(TrelloBoardSchema),
  );
  const organizations = yield* trelloRequest(
    TRELLO_METHODS.get,
    TRELLO_PATHS.organizations,
    { fields: TRELLO_FIELDS_ID },
    Schema.Array(TrelloOrganizationSchema),
  );
  const shared = yield* Effect.forEach(organizations, ({ id }) =>
    trelloRequest(
      TRELLO_METHODS.get,
      TRELLO_PATHS.organizationBoards(id),
      boardsParams,
      Schema.Array(TrelloBoardSchema),
    ),
  );
  const unique = new Map(
    [...own, ...shared.flat()].map((board) => [board.id, board]),
  );
  return [...unique.values()].toSorted((a, b) =>
    a.name.localeCompare(b.name, TRELLO_COLLATION_LOCALE),
  );
});

export const listTrelloLists = Effect.fn("listTrelloLists")(function* (
  boardId: string,
) {
  yield* Effect.annotateLogsScoped({ trelloBoardId: boardId });
  return yield* trelloRequest(
    TRELLO_METHODS.get,
    TRELLO_PATHS.boardLists(boardId),
    { filter: TRELLO_FILTER_OPEN, fields: TRELLO_FIELDS_LIST },
    Schema.Array(TrelloListSchema),
  );
});

export const getTrelloBoard = Effect.fn("getTrelloBoard")(function* (
  boardId: string,
) {
  return yield* trelloRequest(
    TRELLO_METHODS.get,
    TRELLO_PATHS.board(boardId),
    { fields: TRELLO_FIELDS_NAME },
    TrelloBoardSchema,
  );
});

export const getTrelloList = Effect.fn("getTrelloList")(function* (
  listId: string,
) {
  return yield* trelloRequest(
    TRELLO_METHODS.get,
    TRELLO_PATHS.list(listId),
    { fields: TRELLO_FIELDS_LIST },
    TrelloListSchema,
  );
});

export const createTrelloCard = Effect.fn("createTrelloCard")(function* (card: {
  listId: string;
  name: string;
  desc: string;
  due: Date | null;
}) {
  const created = yield* trelloRequest(
    TRELLO_METHODS.post,
    TRELLO_PATHS.cards,
    {
      idList: card.listId,
      name: card.name,
      desc: card.desc,
      due: card.due?.toISOString(),
      pos: TRELLO_POSITION_BOTTOM,
    },
    TrelloCardSchema,
  );
  yield* Effect.annotateLogsScoped({ trelloCardId: created.id });
  return created;
});

export const updateTrelloCard = Effect.fn("updateTrelloCard")(function* (
  cardId: string,
  fields: { closed?: boolean; name?: string },
) {
  yield* Effect.annotateLogsScoped({ trelloCardId: cardId });
  return yield* trelloRequest(
    TRELLO_METHODS.put,
    TRELLO_PATHS.card(cardId),
    fields,
    TrelloCardSchema,
  );
});

export const addTrelloLinkAttachment = Effect.fn("addTrelloLinkAttachment")(
  function* (cardId: string, name: string, url: string) {
    return yield* trelloRequest(
      TRELLO_METHODS.post,
      TRELLO_PATHS.cardAttachments(cardId),
      { name, url },
      TrelloAttachmentSchema,
    );
  },
);

export const listTrelloCardAttachments = Effect.fn("listTrelloCardAttachments")(
  function* (cardId: string) {
    return yield* trelloRequest(
      TRELLO_METHODS.get,
      TRELLO_PATHS.cardAttachments(cardId),
      { fields: TRELLO_FIELDS_NAME },
      Schema.Array(TrelloAttachmentNameSchema),
    );
  },
);

export const deleteTrelloAttachment = Effect.fn("deleteTrelloAttachment")(
  function* (cardId: string, attachmentId: string) {
    yield* trelloFetch(
      TRELLO_METHODS.delete,
      TRELLO_PATHS.cardAttachment(cardId, attachmentId),
      {},
    );
  },
);

export const setTrelloCardCover = Effect.fn("setTrelloCardCover")(function* (
  cardId: string,
  image: { bytes: Uint8Array<ArrayBuffer>; mimeType: string },
) {
  const form = new FormData();
  form.set(
    "file",
    new Blob([image.bytes], { type: image.mimeType }),
    TRELLO_COVER_FILE_NAME,
  );
  return yield* trelloRequest(
    TRELLO_METHODS.post,
    TRELLO_PATHS.cardAttachments(cardId),
    { setCover: true, name: TRELLO_COVER_FILE_NAME },
    TrelloAttachmentSchema,
    form,
  );
});

export const listTrelloWebhooks = Effect.fn("listTrelloWebhooks")(function* () {
  const { token } = yield* TrelloConfig;
  return yield* trelloRequest(
    TRELLO_METHODS.get,
    TRELLO_PATHS.tokenWebhooks(Redacted.value(token)),
    {},
    Schema.Array(TrelloWebhookSchema),
  );
});

export const createTrelloWebhook = Effect.fn("createTrelloWebhook")(function* (
  boardId: string,
) {
  yield* Effect.annotateLogsScoped({ trelloBoardId: boardId });
  const callbackURL = yield* trelloCallbackUrl;
  return yield* trelloRequest(
    TRELLO_METHODS.post,
    TRELLO_PATHS.webhooks,
    {
      idModel: boardId,
      callbackURL,
      description: TRELLO_WEBHOOK_DESCRIPTION,
    },
    TrelloWebhookSchema,
  ).pipe(
    Effect.catchIf(
      (error) =>
        error instanceof TrelloError &&
        TRELLO_WEBHOOK_EXISTS_PATTERN.test(error.summary ?? ""),
      () =>
        listTrelloWebhooks().pipe(
          Effect.flatMap((webhooks) => {
            const existing = webhooks.find(
              (webhook) =>
                webhook.idModel === boardId &&
                webhook.callbackURL === callbackURL,
            );
            return existing
              ? Effect.succeed(existing)
              : Effect.fail(
                  new TrelloError({
                    endpoint: TRELLO_WEBHOOK_PATH,
                    summary: "webhook exists but was not found",
                  }),
                );
          }),
        ),
    ),
  );
});
