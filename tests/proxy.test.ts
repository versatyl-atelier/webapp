import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { Effect } from "effect";

import { Role } from "../src/generated/prisma/enums";

const cookieStore = {
  get: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

import { encrypt, getCookieName } from "../src/lib/session";
import proxy from "../src/proxy";

function requestFor(pathname: string) {
  return new NextRequest(new URL(pathname, "https://versatyl.test"));
}

async function validToken() {
  return Effect.runPromise(
    encrypt({ expiresAt: new Date(Date.now() + 60_000) }),
  );
}

describe("proxy", () => {
  beforeEach(() => {
    cookieStore.get.mockReset();
    cookieStore.get.mockReturnValue(undefined);
  });

  it("allows unprotected routes through even without a session", async () => {
    const response = await proxy(requestFor("/"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects to /login when a protected route has no session cookie", async () => {
    const response = await proxy(requestFor("/punch"));

    const location = response.headers.get("location");
    expect(location).not.toBeNull();
    expect(new URL(location as string).pathname).toBe("/login");
    expect(new URL(location as string).searchParams.get("redirectTo")).toBe(
      "/punch",
    );
  });

  it("allows a protected route through with a valid employee session", async () => {
    const token = await validToken();
    cookieStore.get.mockImplementation((name: string) =>
      name === getCookieName(Role.employee) ? { value: token } : undefined,
    );

    const response = await proxy(requestFor("/punch"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("allows a protected route through with a valid manager session", async () => {
    const token = await validToken();
    cookieStore.get.mockImplementation((name: string) =>
      name === getCookieName(Role.manager) ? { value: token } : undefined,
    );

    const response = await proxy(requestFor("/employee"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects when the only session cookie present is expired", async () => {
    const expiredToken = await Effect.runPromise(
      encrypt({ expiresAt: new Date(Date.now() - 60_000) }),
    );
    cookieStore.get.mockImplementation((name: string) =>
      name === getCookieName(Role.employee)
        ? { value: expiredToken }
        : undefined,
    );

    const response = await proxy(requestFor("/punch"));

    const location = response.headers.get("location");
    expect(location).not.toBeNull();
    expect(new URL(location as string).pathname).toBe("/login");
  });

  it("redirects when the only session cookie present is tampered with", async () => {
    const token = await validToken();
    cookieStore.get.mockImplementation((name: string) =>
      name === getCookieName(Role.employee)
        ? { value: token.slice(0, -1) + (token.at(-1) === "a" ? "b" : "a") }
        : undefined,
    );

    const response = await proxy(requestFor("/punch"));

    const location = response.headers.get("location");
    expect(location).not.toBeNull();
    expect(new URL(location as string).pathname).toBe("/login");
  });
});
