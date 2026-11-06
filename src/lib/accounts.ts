import {
  BYTE_VALUE_COUNT,
  TEMPORARY_PASSWORD_ALPHABET,
  TEMPORARY_PASSWORD_LENGTH,
} from "@/constants/accounts";
import { Role } from "@/generated/prisma/enums";

export type AccountAccess = "none" | "pending" | "active";

export type PersonEmployee = {
  id: number;
  name: string;
  displayOrder: number;
  statut: { id: string; description: string } | null;
  user: {
    id: string;
    email: string;
    role: string | null;
    mustChangePassword: boolean;
  } | null;
};

export type PersonUser = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  mustChangePassword: boolean;
};

export type Person = {
  key: string;
  name: string;
  employeeId: number | null;
  userId: string | null;
  email: string | null;
  role: Role | null;
  statutId: string | null;
  statutLabel: string | null;
  displayOrder: number | null;
  mustChangePassword: boolean;
  access: AccountAccess;
};

const ROLES: readonly string[] = Object.values(Role);

export function toRole(value: string | null): Role | null {
  return ROLES.includes(String(value)) ? (value as Role) : null;
}

export function assignableRoles(hasEmployee: boolean): Role[] {
  return hasEmployee
    ? [Role.employee, Role.manager]
    : [Role.manager, Role.atelier];
}

function accessOf(user: { mustChangePassword: boolean } | null): AccountAccess {
  if (!user) return "none";
  return user.mustChangePassword ? "pending" : "active";
}

function fromEmployee(employee: PersonEmployee): Person {
  return {
    key: `employee-${employee.id}`,
    name: employee.name,
    employeeId: employee.id,
    userId: employee.user?.id ?? null,
    email: employee.user?.email ?? null,
    role: toRole(employee.user?.role ?? null),
    statutId: employee.statut?.id ?? null,
    statutLabel: employee.statut?.description ?? null,
    displayOrder: employee.displayOrder,
    mustChangePassword: employee.user?.mustChangePassword ?? false,
    access: accessOf(employee.user),
  };
}

function fromUser(user: PersonUser): Person {
  return {
    key: `user-${user.id}`,
    name: user.name,
    employeeId: null,
    userId: user.id,
    email: user.email,
    role: toRole(user.role),
    statutId: null,
    statutLabel: null,
    displayOrder: null,
    mustChangePassword: user.mustChangePassword,
    access: accessOf(user),
  };
}

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name);

export function buildPeople(
  employees: readonly PersonEmployee[],
  usersWithoutEmployee: readonly PersonUser[],
): Person[] {
  const employeeRows = [...employees]
    .sort((a, b) => a.displayOrder - b.displayOrder || byName(a, b))
    .map(fromEmployee);
  const userRows = [...usersWithoutEmployee].sort(byName).map(fromUser);
  return [...employeeRows, ...userRows];
}

export function generateTemporaryPassword(
  randomBytes: (count: number) => Uint8Array,
): string {
  const alphabetSize = TEMPORARY_PASSWORD_ALPHABET.length;
  const limit = BYTE_VALUE_COUNT - (BYTE_VALUE_COUNT % alphabetSize);
  let password = "";
  while (password.length < TEMPORARY_PASSWORD_LENGTH) {
    for (const byte of randomBytes(TEMPORARY_PASSWORD_LENGTH)) {
      if (byte < limit && password.length < TEMPORARY_PASSWORD_LENGTH) {
        password += TEMPORARY_PASSWORD_ALPHABET[byte % alphabetSize];
      }
    }
  }
  return password;
}

const secureRandomBytes = (count: number) =>
  crypto.getRandomValues(new Uint8Array(count));

export const newTemporaryPassword = () =>
  generateTemporaryPassword(secureRandomBytes);
