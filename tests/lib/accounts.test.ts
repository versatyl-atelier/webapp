import { describe, expect, it } from "vitest";

import {
  BYTE_VALUE_COUNT,
  TEMPORARY_PASSWORD_ALPHABET,
  TEMPORARY_PASSWORD_LENGTH,
} from "@/constants/accounts";
import { Role } from "@/generated/prisma/enums";
import {
  assignableRoles,
  buildPeople,
  generateTemporaryPassword,
  newTemporaryPassword,
  toRole,
  type PersonEmployee,
  type PersonUser,
} from "@/lib/accounts";

const employee = (
  id: number,
  name: string,
  displayOrder: number,
  user: PersonEmployee["user"] = null,
): PersonEmployee => ({
  id,
  name,
  displayOrder,
  statut: { id: "atelier", description: "Atelier" },
  user,
});

const manager: PersonUser = {
  id: "u-manager",
  name: "Alice",
  email: "alice@example.com",
  role: Role.manager,
  mustChangePassword: false,
};

describe("generateTemporaryPassword", () => {
  it("builds a password of the expected length from the alphabet", () => {
    let next = 0;
    const password = generateTemporaryPassword((count) =>
      Uint8Array.from({ length: count }, () => next++ % BYTE_VALUE_COUNT),
    );
    expect(password).toHaveLength(TEMPORARY_PASSWORD_LENGTH);
    expect(
      [...password].every((c) => TEMPORARY_PASSWORD_ALPHABET.includes(c)),
    ).toBe(true);
  });

  it("rejects bytes that would bias the distribution", () => {
    const limit =
      BYTE_VALUE_COUNT -
      (BYTE_VALUE_COUNT % TEMPORARY_PASSWORD_ALPHABET.length);
    const calls: number[][] = [];
    const password = generateTemporaryPassword((count) => {
      const bytes = calls.length === 0 ? [limit, 255] : [0];
      calls.push(bytes);
      return Uint8Array.from({ length: count }, (_, i) => bytes[i] ?? 0);
    });
    expect(password).toHaveLength(TEMPORARY_PASSWORD_LENGTH);
    expect(calls.length).toBeGreaterThan(0);
  });

  it("produces different passwords from the secure source", () => {
    expect(newTemporaryPassword()).not.toBe(newTemporaryPassword());
  });
});

describe("toRole", () => {
  it("keeps known roles and drops anything else", () => {
    expect(toRole(Role.manager)).toBe(Role.manager);
    expect(toRole("admin")).toBeNull();
    expect(toRole(null)).toBeNull();
  });
});

describe("buildPeople", () => {
  it("orders employees by display order then name, then accounts without employee", () => {
    const people = buildPeople(
      [employee(1, "Zoé", 2), employee(2, "Bob", 1), employee(3, "Annie", 2)],
      [manager],
    );
    expect(people.map(({ name }) => name)).toEqual([
      "Bob",
      "Annie",
      "Zoé",
      "Alice",
    ]);
  });

  it("derives the access state from the account", () => {
    const people = buildPeople(
      [
        employee(1, "Sans compte", 1),
        employee(2, "À activer", 2, {
          id: "u2",
          email: "a@example.com",
          role: Role.employee,
          mustChangePassword: true,
        }),
        employee(3, "Actif", 3, {
          id: "u3",
          email: "b@example.com",
          role: Role.employee,
          mustChangePassword: false,
        }),
      ],
      [],
    );
    expect(people.map(({ access }) => access)).toEqual([
      "none",
      "pending",
      "active",
    ]);
    expect(people[0].email).toBeNull();
    expect(people[1].mustChangePassword).toBe(true);
  });
});

describe("assignableRoles", () => {
  it("keeps employee accounts tied to an employee and atelier accounts free of one", () => {
    expect(assignableRoles(true)).toEqual([Role.employee, Role.manager]);
    expect(assignableRoles(false)).toEqual([Role.manager, Role.atelier]);
  });
});
