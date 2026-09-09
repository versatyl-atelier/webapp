import "server-only";

import { timingSafeEqual } from "node:crypto";

import { Role } from "@/generated/prisma/enums";

export class AuthRequiredError extends Error {
  constructor(public role: Role) {
    super("Authentication required");
    this.name = "AuthRequiredError";
  }
}

export function verifyPassword(
  input: string,
  expected: string | undefined,
): boolean {
  if (!expected) {
    return false;
  }
  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);

  if (inputBuffer.length !== expectedBuffer.length) {
    // Compare against itself to avoid a length-dependent timing signal.
    timingSafeEqual(inputBuffer, inputBuffer);
    return false;
  }

  return timingSafeEqual(inputBuffer, expectedBuffer);
}
