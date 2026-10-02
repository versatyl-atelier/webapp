import "dotenv/config";

import { readFile } from "node:fs/promises";

import { Data, Effect, Schema } from "effect";

import {
  TRELLO_API_URL,
  TRELLO_CARD_FIELDS,
  TRELLO_CARD_FILTER,
  TRELLO_IMPORT_CONFIG_PATH,
} from "@/constants/calendar";
import { trelloCardToEventData } from "@/lib/calendarEvents";
import prisma from "@/lib/prisma";
import {
  TrelloBoardConfigSchema,
  TrelloCardSchema,
  type TrelloBoardConfig,
} from "@/schemas/calendar.schemas";

const TrelloCardsSchema = Schema.Array(TrelloCardSchema);

const TrelloImportConfigSchema = Schema.Struct({
  boards: Schema.Array(TrelloBoardConfigSchema),
});

class TrelloFetchError extends Data.TaggedError("TrelloFetchError")<{
  readonly board: string;
  readonly status?: number;
  readonly cause?: unknown;
}> {}

const configPath = process.argv[2] ?? TRELLO_IMPORT_CONFIG_PATH;

const loadConfig = Effect.tryPromise(() => readFile(configPath, "utf8")).pipe(
  Effect.flatMap(
    Schema.decodeUnknown(Schema.parseJson(TrelloImportConfigSchema)),
  ),
);

function boardCardsUrl({ boardId, apiKey, apiToken }: TrelloBoardConfig) {
  const params = new URLSearchParams({
    key: apiKey,
    token: apiToken,
    filter: TRELLO_CARD_FILTER,
    fields: TRELLO_CARD_FIELDS,
  });
  return `${TRELLO_API_URL}/boards/${boardId}/cards?${params.toString()}`;
}

const fetchBoardCards = Effect.fn("fetchBoardCards")(function* (
  board: TrelloBoardConfig,
) {
  const response = yield* Effect.tryPromise({
    try: () => fetch(boardCardsUrl(board)),
    catch: (cause) => new TrelloFetchError({ board: board.name, cause }),
  });
  if (!response.ok) {
    return yield* new TrelloFetchError({
      board: board.name,
      status: response.status,
    });
  }
  const json = yield* Effect.tryPromise({
    try: () => response.json(),
    catch: (cause) => new TrelloFetchError({ board: board.name, cause }),
  });
  return yield* Schema.decodeUnknown(TrelloCardsSchema)(json);
});

const loadProjectIds = Effect.tryPromise(() =>
  prisma.project.findMany({ select: { id: true } }),
).pipe(Effect.map((projects) => new Set(projects.map(({ id }) => id))));

const importBoard = Effect.fn("importBoard")(function* (
  board: TrelloBoardConfig,
  projectIds: ReadonlySet<string>,
) {
  const cards = yield* fetchBoardCards(board);
  const events = cards.flatMap((card) => {
    const event = trelloCardToEventData(card, board, projectIds);
    return event ? [event] : [];
  });
  const { count } = yield* Effect.tryPromise(() =>
    prisma.calendarEvent.createMany({ data: events, skipDuplicates: true }),
  );
  return {
    board: board.name,
    cards: cards.length,
    withDueDate: events.length,
    inserted: count,
    alreadyImported: events.length - count,
  };
});

const importTrelloEvents = Effect.gen(function* () {
  const { boards } = yield* loadConfig;
  const projectIds = yield* loadProjectIds;
  const results = yield* Effect.forEach(boards, (board) =>
    importBoard(board, projectIds).pipe(
      Effect.catchAll((error) =>
        Effect.sync(() => {
          console.error(`Board ${board.name} failed to import`, error);
          process.exitCode = 1;
          return null;
        }),
      ),
    ),
  );
  console.table(results.filter((result) => result !== null));
});

Effect.runPromise(importTrelloEvents)
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
