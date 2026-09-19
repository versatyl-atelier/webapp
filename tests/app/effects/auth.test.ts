import { describe, it, expect, vi, beforeEach } from "vitest";
import { Cause, Effect, Exit, Option } from "effect";

import { Role } from "@/generated/prisma/enums";
import type { AppSession } from "@/schemas/auth.schemas";

const getSession = vi.fn<() => Promise<AppSession | null>>();

vi.mock("@/lib/session", () => ({ getSession: () => getSession() }));
vi.mock("@/lib/auth", () => ({ auth: {} }));

import {
  assertEmployeeAccess,
  getActiveSession,
  verifySession,
} from "@/effects/auth";
import {
  Forbidden,
  PasswordChangeRequired,
  SessionNotFound,
} from "@/schemas/auth.schemas";

const employeeSession: AppSession = {
  userId: "u-employee",
  role: Role.employee,
  employeeId: 7,
  mustChangePassword: false,
};
const managerSession: AppSession = {
  userId: "u-manager",
  role: Role.manager,
  employeeId: null,
  mustChangePassword: false,
};

const run = <A, E>(effect: Effect.Effect<A, E, import("effect").Scope.Scope>) =>
  Effect.runPromiseExit(Effect.scoped(effect));

const failureOf = <A, E>(exit: Exit.Exit<A, E>) =>
  Exit.isFailure(exit) ? Cause.failureOption(exit.cause) : Option.none();

describe("getActiveSession", () => {
  beforeEach(() => {
    getSession.mockReset();
  });

  it("fails with SessionNotFound when there is no session", async () => {
    getSession.mockResolvedValue(null);

    const exit = await run(getActiveSession());

    expect(Option.getOrNull(failureOf(exit))).toBeInstanceOf(SessionNotFound);
  });

  it("fails with PasswordChangeRequired while the temporary password is in use", async () => {
    getSession.mockResolvedValue({
      ...employeeSession,
      mustChangePassword: true,
    });

    const exit = await run(getActiveSession());

    expect(Option.getOrNull(failureOf(exit))).toBeInstanceOf(
      PasswordChangeRequired,
    );
  });

  it("returns the session otherwise", async () => {
    getSession.mockResolvedValue(employeeSession);

    const exit = await run(getActiveSession());

    expect(Exit.isSuccess(exit) && exit.value).toEqual(employeeSession);
  });
});

describe("verifySession", () => {
  beforeEach(() => {
    getSession.mockReset();
  });

  it("lets an employee through an employee check", async () => {
    getSession.mockResolvedValue(employeeSession);

    expect(Exit.isSuccess(await run(verifySession([Role.employee])))).toBe(
      true,
    );
  });

  it("lets a manager through an employee check", async () => {
    getSession.mockResolvedValue(managerSession);

    expect(Exit.isSuccess(await run(verifySession([Role.employee])))).toBe(
      true,
    );
  });

  it("forbids an employee from a manager check", async () => {
    getSession.mockResolvedValue(employeeSession);

    const exit = await run(verifySession([Role.manager]));

    expect(Option.getOrNull(failureOf(exit))).toBeInstanceOf(Forbidden);
  });

  it("fails with SessionNotFound when signed out", async () => {
    getSession.mockResolvedValue(null);

    const exit = await run(verifySession([Role.employee]));

    expect(Option.getOrNull(failureOf(exit))).toBeInstanceOf(SessionNotFound);
  });
});

describe("assertEmployeeAccess", () => {
  beforeEach(() => {
    getSession.mockReset();
  });

  it("lets an employee act on their own employee", async () => {
    getSession.mockResolvedValue(employeeSession);

    expect(Exit.isSuccess(await run(assertEmployeeAccess(7)))).toBe(true);
  });

  it("forbids an employee from acting on someone else", async () => {
    getSession.mockResolvedValue(employeeSession);

    const exit = await run(assertEmployeeAccess(8));

    expect(Option.getOrNull(failureOf(exit))).toBeInstanceOf(Forbidden);
  });

  it("forbids an employee from acting on data with no owner", async () => {
    getSession.mockResolvedValue(employeeSession);

    const exit = await run(assertEmployeeAccess(null));

    expect(Option.getOrNull(failureOf(exit))).toBeInstanceOf(Forbidden);
  });

  it("lets a manager act on any employee", async () => {
    getSession.mockResolvedValue(managerSession);

    expect(Exit.isSuccess(await run(assertEmployeeAccess(8)))).toBe(true);
    expect(Exit.isSuccess(await run(assertEmployeeAccess(null)))).toBe(true);
  });
});
