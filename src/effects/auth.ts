import { PASSWORDS } from "@/constants/auth";
import type { PrismaService } from "@/generated/effect-prisma";
import { Role } from "@/generated/prisma/enums";
import { verifyPassword } from "@/lib/auth";
import {
  getCookieName,
  decrypt,
  createSession,
  deleteSession,
} from "@/lib/session";
import { Effect } from "effect";
import { cookies } from "next/headers";
import {
  SessionNotFound,
  type LoginFormState,
  type LogoutFormState,
} from "@/schemas/auth.schemas";

export const verifySession = Effect.fn("verifySession")(function* (role: Role) {
  const requestCookies = yield* Effect.tryPromise(cookies);
  const cookieName = getCookieName(role);
  const cookie = requestCookies.get(cookieName);
  const session = yield* decrypt(cookie?.value);

  if (!session) {
    return yield* new SessionNotFound({ role });
  }
});
export const loginEffect = Effect.fn("login")(function* (
  _prisma: PrismaService,
  _formState: LoginFormState,
  { password, role }: Record<string, FormDataEntryValue | null>,
) {
  const rolePassword = process.env[PASSWORDS[role as Role]];

  if (!verifyPassword(String(password), rolePassword)) {
    return {
      success: false,
      errors: {
        password: ["Mauvais mot de passe"],
      },
    };
  }

  yield* createSession(role as Role);
  return { success: true, message: `${role as Role} login success` };
});

export const logoutEffect = Effect.fn("logout")(function* (
  _prisma: PrismaService,
  _formState: LogoutFormState,
  { role }: Record<string, FormDataEntryValue | null>,
) {
  if (role) {
    yield* deleteSession(role as Role);
  } else {
    yield* deleteSession(Role.employee);
    yield* deleteSession(Role.manager);
  }
  return {
    success: true,
    message: "logoutSuccess",
  };
});
