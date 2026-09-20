import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";
import { Schema } from "effect";

import { ROLE_RANK } from "@/constants/auth";
import { Role } from "@/generated/prisma/enums";
import type { AppSession } from "@/schemas/auth.schemas";

export const ac = createAccessControl(defaultStatements);

export const roles = {
  [Role.employee]: ac.newRole({ user: [], session: [] }),
  [Role.manager]: ac.newRole({
    user: ["create", "list", "get", "set-role", "set-password"],
    session: [],
  }),
};

const decodeRole = Schema.decodeUnknownOption(Schema.Enums(Role));

export function parseRole(value: unknown): Role | undefined {
  const role = decodeRole(value);
  return role._tag === "Some" ? role.value : undefined;
}

export function hasRole(actual: Role, required: Role): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[required];
}

export function hasAnyRole(actual: Role, required: readonly Role[]): boolean {
  return required.some((role) => hasRole(actual, role));
}

export function canAccessEmployee(
  session: Pick<AppSession, "role" | "employeeId">,
  employeeId: number | null,
): boolean {
  if (session.role === Role.manager) {
    return true;
  }
  return employeeId !== null && session.employeeId === employeeId;
}

type SessionUser = {
  id: string;
  name: string;
  role?: string | null;
  employeeId?: number | null;
  mustChangePassword?: boolean | null;
};

export function toAppSession(user: SessionUser): AppSession | null {
  const role = parseRole(user.role);
  if (!role) {
    return null;
  }
  return {
    userId: user.id,
    name: user.name,
    role,
    employeeId: user.employeeId ?? null,
    mustChangePassword: user.mustChangePassword ?? false,
  };
}
