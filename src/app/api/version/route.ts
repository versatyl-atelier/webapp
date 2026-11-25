import { Effect } from "effect";
import { NextRequest } from "next/server";

import {
  LoggingLayer,
  requestIdFromHeaders,
  withWideEvent,
} from "@/lib/logging";
import { getVersionInfo } from "@/lib/version";

export async function GET(request: NextRequest) {
  const versionInfo = await Effect.runPromise(
    withWideEvent(
      Effect.sync(() => getVersionInfo(process.env)),
      {
        message: "Version",
        kind: "api",
        requestId: requestIdFromHeaders(request.headers),
        name: getVersionInfo.name,
        defaultLogLevel: "Debug",
      },
    ).pipe(Effect.provide(LoggingLayer)),
  );
  return Response.json(versionInfo);
}
