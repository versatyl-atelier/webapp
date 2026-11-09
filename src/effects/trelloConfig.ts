import { Effect, Schema } from "effect";

import {
  createTrelloWebhook,
  deleteTrelloWebhook,
  listTrelloWebhooks,
  trelloCallbackUrl,
  getTrelloBoard,
  getTrelloList,
  listTrelloBoards,
  listTrelloLists,
} from "@/effects/trello";
import {
  TRELLO_BOARDS_UNAVAILABLE_MESSAGE,
  TRELLO_LIST_TAKEN_MESSAGE,
  TRELLO_WEBHOOK_PATH,
} from "@/constants/trello";
import type { PrismaService } from "@/generated/effect-prisma";
import { webhookStatus } from "@/lib/trello";
import {
  TrelloDestinationKeySchema,
  TrelloIdSchema,
  TrelloStageSchema,
} from "@/schemas/trello.schemas";

export const getTrelloConfigEffect = Effect.fn("getTrelloConfig")(function* (
  prisma: PrismaService,
) {
  const [destinations, stageLists, webhooks] = yield* Effect.all([
    prisma.trelloDestination.findMany({}),
    prisma.trelloStageList.findMany({}),
    prisma.trelloWebhook.findMany({ select: { boardId: true } }),
  ]);
  const boards = yield* listTrelloBoards().pipe(
    Effect.catchAll((error) =>
      Effect.logWarning(TRELLO_BOARDS_UNAVAILABLE_MESSAGE, error).pipe(
        Effect.as(null),
      ),
    ),
  );
  const usedBoards = new Map<string, string>();
  for (const { boardId, boardName } of [...destinations, ...stageLists]) {
    usedBoards.set(boardId, boardName);
  }
  const saved = new Set(webhooks.map(({ boardId }) => boardId));
  const remoteHooks = yield* listTrelloWebhooks().pipe(
    Effect.catchAll(() => Effect.succeed(null)),
  );
  const callbackUrl = yield* trelloCallbackUrl.pipe(
    Effect.catchAll(() => Effect.succeed(null)),
  );
  return {
    boards: boards ?? [],
    unavailable: boards === null,
    destinations,
    stageLists,
    webhooks: [...usedBoards].map(([boardId, boardName]) => ({
      boardId,
      boardName,
      saved: saved.has(boardId),
      ...webhookStatus({
        saved: saved.has(boardId),
        remote: remoteHooks?.find(
          ({ idModel, callbackURL }) =>
            idModel === boardId && callbackURL.endsWith(TRELLO_WEBHOOK_PATH),
        ),
        remoteKnown: remoteHooks !== null,
        callbackUrl,
      }),
    })),
  };
});

export const reregisterTrelloWebhooksEffect = Effect.fn(
  "reregisterTrelloWebhooks",
)(function* (prisma: PrismaService) {
  const [destinations, stageLists, existing] = yield* Effect.all([
    prisma.trelloDestination.findMany({ select: { boardId: true } }),
    prisma.trelloStageList.findMany({ select: { boardId: true } }),
    listTrelloWebhooks(),
  ]);
  const boardIds = new Set(
    [...destinations, ...stageLists].map(({ boardId }) => boardId),
  );
  for (const boardId of boardIds) {
    const ours = existing.filter(
      ({ idModel, callbackURL }) =>
        idModel === boardId && callbackURL.endsWith(TRELLO_WEBHOOK_PATH),
    );
    const webhook = yield* createTrelloWebhook(boardId);
    for (const { id } of ours.filter(({ id: oldId }) => oldId !== webhook.id)) {
      yield* deleteTrelloWebhook(id);
    }
    yield* prisma.trelloWebhook.deleteMany({ where: { boardId } });
    yield* prisma.trelloWebhook.create({
      data: { boardId, webhookId: webhook.id },
    });
  }
  yield* Effect.annotateLogsScoped({ webhooksReregistered: boardIds.size });
  return boardIds.size;
});

export const getTrelloListsEffect = Effect.fn("getTrelloLists")(function* (
  _prisma: PrismaService,
  boardId: unknown,
) {
  const id = yield* Schema.decodeUnknown(TrelloIdSchema)(boardId);
  const lists = yield* listTrelloLists(id);
  return lists.map(({ id: listId, name }) => ({ id: listId, name }));
});

const resolveList = Effect.fn("resolveTrelloList")(function* (listId: unknown) {
  const id = yield* Schema.decodeUnknown(TrelloIdSchema)(listId);
  const list = yield* getTrelloList(id);
  const board = yield* getTrelloBoard(list.idBoard);
  return {
    boardId: board.id,
    boardName: board.name,
    listId: list.id,
    listName: list.name,
  };
});

export const saveTrelloDestinationEffect = Effect.fn("saveTrelloDestination")(
  function* (prisma: PrismaService, key: unknown, listId: unknown) {
    const parsedKey = yield* Schema.decodeUnknown(TrelloDestinationKeySchema)(
      key,
    );
    const target = yield* resolveList(listId);
    yield* prisma.trelloDestination.upsert({
      where: { key: parsedKey },
      create: { key: parsedKey, ...target },
      update: target,
    });
  },
);

export const clearTrelloDestinationEffect = Effect.fn("clearTrelloDestination")(
  function* (prisma: PrismaService, key: unknown) {
    const parsedKey = yield* Schema.decodeUnknown(TrelloDestinationKeySchema)(
      key,
    );
    yield* prisma.trelloDestination.deleteMany({ where: { key: parsedKey } });
  },
);

export const saveTrelloStageListEffect = Effect.fn("saveTrelloStageList")(
  function* (prisma: PrismaService, stage: unknown, listId: unknown) {
    const parsedStage = yield* Schema.decodeUnknown(TrelloStageSchema)(stage);
    const target = yield* resolveList(listId);
    const taken = yield* prisma.trelloStageList.count({
      where: { listId: target.listId, stage: { not: parsedStage } },
    });
    if (taken > 0) {
      return TRELLO_LIST_TAKEN_MESSAGE;
    }
    yield* prisma.trelloStageList.upsert({
      where: { stage: parsedStage },
      create: { stage: parsedStage, ...target },
      update: target,
    });
    return null;
  },
);

export const clearTrelloStageListEffect = Effect.fn("clearTrelloStageList")(
  function* (prisma: PrismaService, stage: unknown) {
    const parsedStage = yield* Schema.decodeUnknown(TrelloStageSchema)(stage);
    yield* prisma.trelloStageList.deleteMany({ where: { stage: parsedStage } });
  },
);

export const registerTrelloWebhooksEffect = Effect.fn("registerTrelloWebhooks")(
  function* (prisma: PrismaService) {
    const [destinations, stageLists, webhooks] = yield* Effect.all([
      prisma.trelloDestination.findMany({ select: { boardId: true } }),
      prisma.trelloStageList.findMany({ select: { boardId: true } }),
      prisma.trelloWebhook.findMany({ select: { boardId: true } }),
    ]);
    const registered = new Set(webhooks.map(({ boardId }) => boardId));
    const missing = new Set(
      [...destinations, ...stageLists]
        .map(({ boardId }) => boardId)
        .filter((boardId) => !registered.has(boardId)),
    );
    for (const boardId of missing) {
      const webhook = yield* createTrelloWebhook(boardId);
      yield* prisma.trelloWebhook.create({
        data: { boardId, webhookId: webhook.id },
      });
    }
    yield* Effect.annotateLogsScoped({ webhooksRegistered: missing.size });
    return missing.size;
  },
);
