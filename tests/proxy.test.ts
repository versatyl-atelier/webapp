import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";

import proxy from "@/proxy";

const SESSION_COOKIE = "better-auth.session_token";

function requestFor(pathname: string, cookie?: string) {
  return new NextRequest(new URL(pathname, "https://versatyl.test"), {
    headers: cookie ? { cookie } : undefined,
  });
}

describe("proxy", () => {
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

  it("protects nested routes and keeps the query string in the redirect", async () => {
    const response = await proxy(requestFor("/punch/employe/4?weekOffset=-1"));

    const location = response.headers.get("location");
    expect(location).not.toBeNull();
    expect(new URL(location as string).searchParams.get("redirectTo")).toBe(
      "/punch/employe/4?weekOffset=-1",
    );
  });

  it("allows a protected route through when a session cookie is present", async () => {
    const response = await proxy(
      requestFor("/punch", `${SESSION_COOKIE}=token.signature`),
    );

    expect(response.headers.get("location")).toBeNull();
  });

  it("allows a protected route through with the secure-prefixed cookie", async () => {
    const response = await proxy(
      requestFor("/punch", `__Secure-${SESSION_COOKIE}=token.signature`),
    );

    expect(response.headers.get("location")).toBeNull();
  });
});
