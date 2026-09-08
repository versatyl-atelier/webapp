import { NextRequest, NextResponse } from "next/server";
import { decrypt, getCookieName } from "@/lib/session";
import { cookies } from "next/headers";
import { Role } from "@/generated/prisma/enums";
import { Data, Effect } from "effect";
import {
  LoggingLayer,
  requestIdFromHeaders,
  withWideEvent,
} from "@/lib/logging";

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};

const protectedRoutes = ["/punch", "/employee"];

export class Unauthorized extends Data.TaggedError("Unauthorized") {}

export default async function proxy(req: NextRequest) {
  const requestId = requestIdFromHeaders(req.headers);

  return Effect.runPromise(
    withWideEvent(
      proxyRequest(req).pipe(
        Effect.catchTag("Unauthorized", (error) => {
          return Effect.succeed(false);
        }),
      ),
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
      Effect.match({
        onSuccess: (wasAuthorized) =>
          wasAuthorized
            ? NextResponse.next()
            : NextResponse.redirect(
                new URL(
                  `/login?role=${Role.employee}&redirectTo=${encodeURIComponent(
                    req.nextUrl.pathname,
                  )}`,
                  req.nextUrl,
                ),
              ),
        onFailure: (error) => {
          throw error;
        },
      }),
    ),
  );
}

const proxyRequest = Effect.fn("proxyRequest")(function* (req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);

  if (!isProtectedRoute) {
    return true;
  }

  const allCookies = yield* Effect.tryPromise(cookies);

  const employeeCookie = allCookies.get(getCookieName(Role.employee))?.value;
  const employeeSession = employeeCookie
    ? yield* decrypt(employeeCookie)
    : null;

  if (employeeSession) {
    return true;
  }
  const managerCookie = allCookies.get(getCookieName(Role.manager))?.value;
  const managerSession = managerCookie ? yield* decrypt(managerCookie) : null;

  if (managerSession) {
    return true;
  }
  return yield* new Unauthorized();
});
