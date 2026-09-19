import { getSessionCookie } from "better-auth/cookies";
import { Effect } from "effect";
import { NextRequest, NextResponse } from "next/server";

import { isProtectedPath, loginPath } from "@/lib/paths";
import {
  LoggingLayer,
  requestIdFromHeaders,
  withWideEvent,
} from "@/lib/logging";

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};

export default async function proxy(req: NextRequest) {
  const requestId = requestIdFromHeaders(req.headers);

  return Effect.runPromise(
    withWideEvent(
      Effect.sync(() => isAuthorized(req)),
      {
        message: "Proxy request",
        kind: "proxy",
        requestId,
        name: req.nextUrl.pathname,
        defaultLogLevel: "Debug",
        setLogLevel: (wasAuthorized) => ({
          level: wasAuthorized ? "Debug" : "Info",
        }),
      },
    ).pipe(
      Effect.provide(LoggingLayer),
      Effect.map((wasAuthorized) =>
        wasAuthorized
          ? NextResponse.next()
          : NextResponse.redirect(
              new URL(
                loginPath(req.nextUrl.pathname + req.nextUrl.search),
                req.nextUrl,
              ),
            ),
      ),
    ),
  );
}

const isAuthorized = (req: NextRequest) =>
  !isProtectedPath(req.nextUrl.pathname) || !!getSessionCookie(req);
