import { describe, it, expect } from "vitest";

import { Role } from "@/generated/prisma/enums";
import {
  canAccessEmployee,
  hasRole,
  parseRole,
  toAppSession,
} from "@/lib/permissions";

describe("parseRole", () => {
  it("accepts known roles", () => {
    expect(parseRole("employee")).toBe(Role.employee);
    expect(parseRole("manager")).toBe(Role.manager);
  });

  it("rejects unknown, comma-separated and empty values", () => {
    expect(parseRole("admin")).toBeUndefined();
    expect(parseRole("employee,manager")).toBeUndefined();
    expect(parseRole("")).toBeUndefined();
    expect(parseRole(null)).toBeUndefined();
    expect(parseRole(undefined)).toBeUndefined();
  });
});

describe("hasRole", () => {
  it("lets a manager do anything an employee can", () => {
    expect(hasRole(Role.manager, Role.employee)).toBe(true);
    expect(hasRole(Role.manager, Role.manager)).toBe(true);
    expect(hasRole(Role.employee, Role.employee)).toBe(true);
  });

  it("keeps employees out of manager-only actions", () => {
    expect(hasRole(Role.employee, Role.manager)).toBe(false);
  });
});

describe("canAccessEmployee", () => {
  it("lets a manager access any employee, linked or not", () => {
    const manager = { role: Role.manager, employeeId: null };

    expect(canAccessEmployee(manager, 1)).toBe(true);
    expect(canAccessEmployee(manager, null)).toBe(true);
  });

  it("lets an employee access only their own employee", () => {
    const employee = { role: Role.employee, employeeId: 7 };

    expect(canAccessEmployee(employee, 7)).toBe(true);
    expect(canAccessEmployee(employee, 8)).toBe(false);
    expect(canAccessEmployee(employee, null)).toBe(false);
  });

  it("gives an employee with no linked employee access to nothing", () => {
    const unlinked = { role: Role.employee, employeeId: null };

    expect(canAccessEmployee(unlinked, 1)).toBe(false);
    expect(canAccessEmployee(unlinked, null)).toBe(false);
  });

  it("does not let NaN match an unlinked employee", () => {
    const employee = { role: Role.employee, employeeId: 7 };

    expect(canAccessEmployee(employee, Number.NaN)).toBe(false);
  });
});

describe("toAppSession", () => {
  it("maps a better-auth user to an app session", () => {
    expect(
      toAppSession({
        id: "u1",
        name: "User One",
        role: "employee",
        employeeId: 3,
        mustChangePassword: true,
      }),
    ).toEqual({
      userId: "u1",
      name: "User One",
      role: Role.employee,
      employeeId: 3,
      mustChangePassword: true,
    });
  });

  it("defaults missing optional fields", () => {
    expect(
      toAppSession({ id: "u2", name: "User Two", role: "manager" }),
    ).toEqual({
      userId: "u2",
      name: "User Two",
      role: Role.manager,
      employeeId: null,
      mustChangePassword: false,
    });
  });

  it("returns null when the role is missing or unknown", () => {
    expect(
      toAppSession({ id: "u3", name: "User Three", role: null }),
    ).toBeNull();
    expect(
      toAppSession({ id: "u4", name: "User Four", role: "admin" }),
    ).toBeNull();
  });
});
