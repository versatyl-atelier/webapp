import { describe, it, expect } from "vitest";

import { PUNCH_PATH, PUNCH_REPORT_PATH, PUNCH_TOOLS } from "@/constants/punch";
import { PROJECTS_PATH } from "@/constants/tools";
import {
  activeSectionHref,
  activeToolHref,
  changePasswordPath,
  employeePath,
  isProtectedPath,
  loginPath,
  projectPath,
} from "@/lib/paths";

describe("loginPath", () => {
  it("has no query string without a redirect", () => {
    expect(loginPath()).toBe("/login");
  });

  it("encodes the redirect target", () => {
    expect(loginPath("/punch/employe/1?weekOffset=-1")).toBe(
      "/login?redirectTo=%2Fpunch%2Femploye%2F1%3FweekOffset%3D-1",
    );
  });

  it("adds the e-mail after the redirect target", () => {
    expect(loginPath("/punch/employe/2", "a@b.c")).toBe(
      "/login?redirectTo=%2Fpunch%2Femploye%2F2&email=a%40b.c",
    );
  });

  it("adds the e-mail alone", () => {
    expect(loginPath(undefined, "a@b.c")).toBe("/login?email=a%40b.c");
  });
});

describe("employeePath", () => {
  it("builds the employee page path", () => {
    expect(employeePath(4)).toBe("/punch/employe/4");
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
  });

  it("protects the manager interface", () => {
    expect(isProtectedPath("/gestionnaire")).toBe(true);
  });

  it("protects the home page but not every path under it", () => {
    expect(isProtectedPath("/")).toBe(true);
    expect(isProtectedPath("/login")).toBe(false);
  });

  it("protects the search page", () => {
    expect(isProtectedPath("/recherche")).toBe(true);
  });

  it("protects the change-password page", () => {
    expect(isProtectedPath("/change-password")).toBe(true);
  });

  it("does not match look-alike prefixes or public pages", () => {
    expect(isProtectedPath("/punchcard")).toBe(false);
    expect(isProtectedPath("/login")).toBe(false);
  });
});

describe("projectPath", () => {
  it("builds the project page path", () => {
    expect(projectPath("abc")).toBe("/projets/abc");
  });
});

describe("activeSectionHref", () => {
  it("keeps the punch section active on employee pages", () => {
    expect(activeSectionHref(PUNCH_TOOLS, "/punch/employe/4")).toBe(PUNCH_PATH);
  });

  it("prefers the most specific section", () => {
    expect(activeSectionHref(PUNCH_TOOLS, "/punch/rapport/imprimable")).toBe(
      PUNCH_REPORT_PATH,
    );
  });

  it("matches nothing outside the sections", () => {
    expect(activeSectionHref(PUNCH_TOOLS, "/projets")).toBeUndefined();
  });
});

describe("activeToolHref", () => {
  it("matches the projects tool on project pages", () => {
    expect(activeToolHref("/projets/abc")).toBe(PROJECTS_PATH);
  });

  it("matches nothing outside the tools", () => {
    expect(activeToolHref("/")).toBeUndefined();
  });
});
