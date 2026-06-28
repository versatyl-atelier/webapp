import { redirect } from "next/navigation";

function isAuthError(value: unknown): value is { errors: { auth: string } } {
  const auth = (value as any)?.errors?.auth;
  return typeof auth === "string" && auth.split(":")[0] === "auth_required";
}

export function assertNoAuthError<T>(
  value: T | { errors: { auth: string } },
): asserts value is T {
  if (isAuthError(value)) {
    const role = value.errors.auth.split(":")[1];
    redirect(`/login?role=${role}`);
  }
}
