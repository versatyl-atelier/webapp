import { Effect, Option, Redacted, Schema } from "effect";

import { trelloCallbackUrl, trelloWebhookSecret } from "@/effects/trello";
import { TRELLO_WEBHOOK_STATUS } from "@/constants/trello";
import type { PrismaService } from "@/generated/effect-prisma";
import {
  cardEventFromAction,
  isValidWebhookSignature,
  planCardEvent,
} from "@/lib/trello";
import { TrelloWebhookPayloadSchema } from "@/schemas/trello.schemas";

export const handleTrelloWebhookEffect = Effect.fn("handleTrelloWebhook")(
  function* (prisma: PrismaService, body: string, signature: string | null) {
    const secret = yield* trelloWebhookSecret;
    const callbackUrl = yield* trelloCallbackUrl;
    if (
      !isValidWebhookSignature(
        body,
        callbackUrl,
        Redacted.value(secret),
        signature,
      )
    ) {
      yield* Effect.annotateLogsScoped({
        signaturePresent: signature !== null,
        nonAsciiBody: Buffer.byteLength(body) !== body.length,
      });
      return TRELLO_WEBHOOK_STATUS.unauthorized;
    }
    const payload = yield* Schema.decodeUnknown(
      Schema.parseJson(TrelloWebhookPayloadSchema),
    )(body).pipe(Effect.option);
    if (Option.isNone(payload)) {
      return TRELLO_WEBHOOK_STATUS.badRequest;
    }
    const event = cardEventFromAction(payload.value.action);
    if (event === null) {
      return TRELLO_WEBHOOK_STATUS.ok;
    }
    const card = yield* prisma.trelloCard.findUnique({
      where: { trelloCardId: event.trelloCardId },
      select: {
        id: true,
        projectId: true,
        state: true,
        boardId: true,
        listId: true,
      },
    });
    if (!card) {
      return TRELLO_WEBHOOK_STATUS.ok;
    }
    yield* Effect.annotateLogsScoped({
      projectId: card.projectId,
      trelloCardId: event.trelloCardId,
      trelloEvent: event.kind,
    });
    const known = yield* prisma.trelloEvent.count({
      where: { actionId: event.actionId },
    });
    if (known > 0) {
      return TRELLO_WEBHOOK_STATUS.ok;
    }
    const stageLists = yield* prisma.trelloStageList.findMany({
      select: { stage: true, listId: true },
    });
    const { patch, stage } = planCardEvent(card, event, stageLists);
    yield* prisma.$transaction(
      Effect.all([
        prisma.trelloEvent.create({
          data: {
            actionId: event.actionId,
            cardId: card.id,
            trelloCardId: event.trelloCardId,
            type: event.type,
            fromBoardId: event.fromBoardId,
            fromListId: event.fromListId,
            toBoardId: event.toBoardId,
            toListId: event.toListId,
            actorName: event.actorName,
            occurredAt: event.occurredAt,
          },
        }),
        prisma.trelloCard.update({ where: { id: card.id }, data: patch }),
        ...(stage === null
          ? []
          : [
              prisma.project.update({
                where: { id: card.projectId },
                data: { stage },
              }),
            ]),
      ]),
    );
    return TRELLO_WEBHOOK_STATUS.ok;
  },
);
