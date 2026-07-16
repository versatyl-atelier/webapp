import { Role } from "@/generated/prisma/enums";
import { getCookieName, decrypt } from "@/lib/session";
import { Data, Effect } from "effect";
import { cookies } from "next/headers";

export class SessionNotFound extends Data.TaggedError("SessionNotFound")<{
  readonly role: Role;
}> {
  public toString() {
    return `SessionNotFound:${this.role}`;
  }
}

export const verifySession = (role: Role) =>
  Effect.gen(function* () {
    const requestCookies = yield* Effect.tryPromise(cookies);
    const cookieName = getCookieName(role);
    const cookie = requestCookies.get(cookieName);
    const session = yield* decrypt(cookie?.value);

    if (!session) {
      return yield* new SessionNotFound({ role });
    }
  });
