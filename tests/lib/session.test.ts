import { describe, it, expect, vi, beforeEach } from "vitest";
import { Cause, Effect, Exit, Option } from "effect";

import { Role } from "../../src/generated/prisma/enums";

const cookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

import {
  encrypt,
  decrypt,
  createSession,
  getCookieName,
} from "../../src/lib/session";

describe("getCookieName", () => {
  it("resolves the configured cookie name for each role", () => {
    expect(getCookieName(Role.employee)).toBe("versatyl-session-employe");
    expect(getCookieName(Role.manager)).toBe("versatyl-session-gestionnaire");
  });
});

describe("encrypt / decrypt", () => {
  it("round-trips a session payload", async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    const token = await Effect.runPromise(encrypt({ expiresAt }));
    const payload = await Effect.runPromise(decrypt(token));

    expect(payload?.exp).toBe(Math.floor(expiresAt.getTime() / 1000));
  });

  it("resolves to undefined when there is no session token", async () => {
    const payload = await Effect.runPromise(decrypt(undefined));
    expect(payload).toBeUndefined();
  });

  it("fails to decrypt a tampered token", async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    const token = await Effect.runPromise(encrypt({ expiresAt }));
    const tampered = token.slice(0, -1) + (token.at(-1) === "a" ? "b" : "a");

    const exit = await Effect.runPromiseExit(decrypt(tampered));

    expect(Exit.isFailure(exit)).toBe(true);
    const failure = Exit.isFailure(exit)
      ? Cause.failureOption(exit.cause)
      : Option.none();
    expect(Option.isSome(failure) && failure.value._tag).toBe(
      "SessionDecryptError",
    );
  });

  it("fails to decrypt an expired token", async () => {
    const expiresAt = new Date(Date.now() - 60_000);
    const token = await Effect.runPromise(encrypt({ expiresAt }));

    const exit = await Effect.runPromiseExit(decrypt(token));

    expect(Exit.isFailure(exit)).toBe(true);
    const failure = Exit.isFailure(exit)
      ? Cause.failureOption(exit.cause)
      : Option.none();
    expect(Option.isSome(failure) && failure.value._tag).toBe(
      "SessionDecryptError",
    );
  });
});

describe("createSession", () => {
  beforeEach(() => {
    cookieStore.set.mockClear();
  });

  it("sets an encrypted, http-only cookie for the given role", async () => {
    await Effect.runPromise(createSession(Role.employee));

    expect(cookieStore.set).toHaveBeenCalledTimes(1);
    const [name, value, options] = cookieStore.set.mock.calls[0];

    expect(name).toBe("versatyl-session-employe");
    expect(options).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });

    const payload = await Effect.runPromise(decrypt(value));
    expect(payload).toBeDefined();
  });

  it("uses the manager cookie name when creating a manager session", async () => {
    await Effect.runPromise(createSession(Role.manager));

    const [name] = cookieStore.set.mock.calls[0];
    expect(name).toBe("versatyl-session-gestionnaire");
  });
});
