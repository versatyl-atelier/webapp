import { Role } from "@/generated/prisma/enums";

export const SESSION_COOKIE_EMPLOYEE = process.env.SESSION_COOKIE_EMPLOYEE;
export const SESSION_COOKIE_MANAGER = process.env.SESSION_COOKIE_MANAGER;

export const SESSION_COOKIE_NAMES = {
  [Role.employee]: SESSION_COOKIE_EMPLOYEE,
  [Role.manager]: SESSION_COOKIE_MANAGER,
};

export const COOKIE_CONFIG = {
  httpOnly: true,
  path: "/",
  maxAge: undefined,
};

export const PASSWORDS: Record<Role, string> = {
  employee: "VERSATYL_PASSWORD_EMPLOYEE",
  manager: "VERSATYL_PASSWORD_MANAGER",
};
