import { describe, it, expect } from "vitest";

import { changePasswordPath, isProtectedPath, loginPath } from "@/lib/paths";

describe("loginPath", () => {
  it("has no query string without a redirect", () => {
    expect(loginPath()).toBe("/login");
  });

  it("encodes the redirect target", () => {
    expect(loginPath("/punch/employe/1?weekOffset=-1")).toBe(
      "/login?redirectTo=%2Fpunch%2Femploye%2F1%3FweekOffset%3D-1",
    );
  });
});

describe("changePasswordPath", () => {
  it("carries the redirect target", () => {
    expect(changePasswordPath("/punch")).toBe(
      "/change-password?redirectTo=%2Fpunch",
    );
  });
});

describe("isProtectedPath", () => {
  it("protects /punch and everything under it", () => {
    expect(isProtectedPath("/punch")).toBe(true);
    expect(isProtectedPath("/punch/employe/1")).toBe(true);
    expect(isProtectedPath("/punch/gestionnaire")).toBe(true);
  });

  it("protects the change-password page", () => {
    expect(isProtectedPath("/change-password")).toBe(true);
  });

  it("does not match look-alike prefixes or public pages", () => {
    expect(isProtectedPath("/punchcard")).toBe(false);
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/login")).toBe(false);
  });
});
