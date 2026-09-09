import { describe, it, expect, vi, beforeEach } from "vitest";
import { Cause, Effect, Exit, Option } from "effect";

import { Role } from "../../../src/generated/prisma/enums";

const cookieStore = {
  get: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

import { encrypt } from "../../../src/lib/session";
import { verifySession, SessionNotFound } from "../../../src/app/effects/auth";

describe("verifySession", () => {
  beforeEach(() => {
    cookieStore.get.mockReset();
  });

  it("succeeds when a valid session cookie is present", async () => {
    const token = await Effect.runPromise(
      encrypt({ expiresAt: new Date(Date.now() + 60_000) }),
    );
    cookieStore.get.mockReturnValue({ value: token });

    const exit = await Effect.runPromiseExit(verifySession(Role.employee));

    expect(Exit.isSuccess(exit)).toBe(true);
    expect(cookieStore.get).toHaveBeenCalledWith("versatyl-session-employe");
  });

  it("fails with SessionNotFound when there is no session cookie", async () => {
    cookieStore.get.mockReturnValue(undefined);

    const exit = await Effect.runPromiseExit(verifySession(Role.manager));

    expect(Exit.isFailure(exit)).toBe(true);
    const failure = Exit.isFailure(exit)
      ? Cause.failureOption(exit.cause)
      : Option.none();
    expect(Option.isSome(failure) && failure.value).toBeInstanceOf(
      SessionNotFound,
    );
  });

  it("fails when the session cookie is tampered with", async () => {
    const token = await Effect.runPromise(
      encrypt({ expiresAt: new Date(Date.now() + 60_000) }),
    );
    cookieStore.get.mockReturnValue({
      value: token.slice(0, -1) + (token.at(-1) === "a" ? "b" : "a"),
    });

    const exit = await Effect.runPromiseExit(verifySession(Role.employee));

    expect(Exit.isFailure(exit)).toBe(true);
  });

  it("fails when the session cookie is expired", async () => {
    const token = await Effect.runPromise(
      encrypt({ expiresAt: new Date(Date.now() - 60_000) }),
    );
    cookieStore.get.mockReturnValue({ value: token });

    const exit = await Effect.runPromiseExit(verifySession(Role.employee));

    expect(Exit.isFailure(exit)).toBe(true);
  });

  it("checks the cookie belonging to the requested role, not another role's", async () => {
    const employeeToken = await Effect.runPromise(
      encrypt({ expiresAt: new Date(Date.now() + 60_000) }),
    );
    cookieStore.get.mockImplementation((name: string) =>
      name === "versatyl-session-employe"
        ? { value: employeeToken }
        : undefined,
    );

    const managerExit = await Effect.runPromiseExit(
      verifySession(Role.manager),
    );
    expect(Exit.isFailure(managerExit)).toBe(true);

    const employeeExit = await Effect.runPromiseExit(
      verifySession(Role.employee),
    );
    expect(Exit.isSuccess(employeeExit)).toBe(true);
  });
});
