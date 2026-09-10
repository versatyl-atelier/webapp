import "server-only";

import { cookies } from "next/headers";

import { SignJWT, jwtVerify } from "jose";
import { Role } from "@/generated/prisma/client";
import type { SessionPayload } from "@/schemas/auth.schemas";
import { SESSION_COOKIE_NAMES, SECURE_COOKIES } from "@/constants/auth";
import { Data, Effect } from "effect";
import { SessionNotFound } from "@/schemas/auth.schemas";

const SESSION_DURATIONS: Record<Role, number> = {
  [Role.employee]: 365 * 24 * 60 * 60 * 1000,
  [Role.manager]: 1 * 60 * 1000,
};

if (!process.env.SESSION_SECRET) {
  throw new Error(
    "The SESSION_SECRET environment variable must have a non-empty value in .env",
  );
}
const secretKey = process.env.SESSION_SECRET || "";
const encodedKey = new TextEncoder().encode(secretKey);

class SessionEncryptError extends Data.TaggedError("SessionEncryptError")<{
  readonly payload: SessionPayload;
  readonly cause: unknown;
}> {}

export const encrypt = (payload: SessionPayload) =>
  Effect.tryPromise({
    try: () =>
      new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(payload.expiresAt)
        .sign(encodedKey),
    catch: (error) =>
      new SessionEncryptError({
        payload,
        cause: error,
      }),
  });

class SessionDecryptError extends Data.TaggedError("SessionDecryptError")<{
  readonly session: string | undefined;
  readonly cause: unknown;
}> {}
export const decrypt = (session: string | undefined = "") =>
  Effect.tryPromise({
    try: async () => {
      if (!session) {
        return undefined;
      }
      const { payload } = await jwtVerify(session, encodedKey, {
        algorithms: ["HS256"],
      });
      return payload;
    },
    catch: (error) =>
      new SessionDecryptError({
        session,
        cause: error,
      }),
  });

export const createSession = Effect.fn("createSession")(function* (role: Role) {
  const expiresAt = new Date(Date.now() + SESSION_DURATIONS[role]);
  const session = yield* encrypt({ expiresAt });
  const cookieStore = yield* Effect.tryPromise(() => cookies());
  const cookieName = getCookieName(role);

  cookieStore.set(cookieName, session, {
    httpOnly: true,
    secure: SECURE_COOKIES,
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
});

export const updateSession = Effect.fn("updateSession")(function* (role: Role) {
  const cookieStore = yield* Effect.tryPromise(() => cookies());
  const cookieName = getCookieName(role);
  const session = cookieStore.get(cookieName)?.value;
  const payload = yield* decrypt(session);

  yield* Effect.filterOrFail(
    Effect.succeed({ session, payload }),
    ({ session, payload }) => !!session && !!payload,
    () => new SessionNotFound({ role }),
  );

  cookieStore.set(cookieName, session || "", {
    httpOnly: true,
    secure: SECURE_COOKIES,
    expires: new Date(Date.now() + SESSION_DURATIONS[role]),
    sameSite: "lax",
    path: "/",
  });
});

export const deleteSession = Effect.fn("deleteSession")(function* (role: Role) {
  const cookieStore = yield* Effect.tryPromise(() => cookies());
  cookieStore.delete(getCookieName(role));
});

export const getCookieName = (role: Role) => SESSION_COOKIE_NAMES[role];
