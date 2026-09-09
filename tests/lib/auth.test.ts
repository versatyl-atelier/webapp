import { describe, it, expect } from "vitest";

import { verifyPassword } from "../../src/lib/auth";

describe("verifyPassword", () => {
  it("returns true when the input matches the expected password", () => {
    expect(verifyPassword("correct-password", "correct-password")).toBe(true);
  });

  it("returns false when the input does not match the expected password", () => {
    expect(verifyPassword("wrong-password", "correct-password")).toBe(false);
  });

  it("returns false when the input differs in length from the expected password", () => {
    expect(verifyPassword("short", "much-longer-password")).toBe(false);
    expect(verifyPassword("much-longer-password", "short")).toBe(false);
  });

  it("returns false when no expected password is configured", () => {
    expect(verifyPassword("anything", undefined)).toBe(false);
  });

  it("returns false for an empty input against a configured password", () => {
    expect(verifyPassword("", "correct-password")).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(verifyPassword("Password", "password")).toBe(false);
  });
});
