import { Role } from "@/generated/prisma/enums";

export class AuthRequiredError extends Error {
  constructor(public role: Role) {
    super("Authentication required");
    this.name = "AuthRequiredError";
  }
}

export function isAuthError(
  state: unknown,
): state is { error: "auth_required"; role: Role } {
  return (
    state != null &&
    typeof state === "object" &&
    "error" in state &&
    (state as { error?: string }).error === "auth_required"
  );
}
export function handleAuthError(
  value: unknown,
): { errors: { auth: string } } | null {
  if (value instanceof AuthRequiredError) {
    return {
      errors: {
        auth: `auth_required:${value.role}`,
      },
    };
  }
  return null;
}
