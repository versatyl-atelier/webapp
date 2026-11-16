import { Effect } from "effect";
import { NextRequest } from "next/server";

import {
  TRELLO_SIGNATURE_HEADER,
  TRELLO_WEBHOOK_STATUS,
} from "@/constants/trello";
import { handleTrelloWebhookEffect } from "@/effects/trelloWebhook";
import { PrismaService } from "@/generated/effect-prisma";
import {
  LoggingLayer,
  requestIdFromHeaders,
  withWideEvent,
} from "@/lib/logging";
import { PrismaLayer } from "@/lib/prisma";

export async function HEAD() {
  return new Response(null, { status: TRELLO_WEBHOOK_STATUS.ok });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get(TRELLO_SIGNATURE_HEADER);
  const status = await Effect.runPromise(
    withWideEvent(
      Effect.gen(function* () {
        const prisma = yield* PrismaService;
        const code = yield* handleTrelloWebhookEffect(prisma, body, signature);
        yield* Effect.annotateLogsScoped({ statusCode: code });
        return code;
      }),
      {
        message: "Trello webhook",
        kind: "webhook",
        requestId: requestIdFromHeaders(request.headers),
        name: handleTrelloWebhookEffect.name,
        defaultLogLevel: "Info",
        setLogLevel: (code) => ({
          level: code === TRELLO_WEBHOOK_STATUS.ok ? "Debug" : "Warning",
        }),
      },
    ).pipe(
      Effect.scoped,
      Effect.catchAllCause(() => Effect.succeed(TRELLO_WEBHOOK_STATUS.error)),
      Effect.provide(PrismaLayer),
      Effect.provide(LoggingLayer),
    ),
  );
  return new Response(null, { status });
}
