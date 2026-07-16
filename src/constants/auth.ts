import { Role } from "@/generated/prisma/enums";

export const SESSION_COOKIE_EMPLOYEE =
  process.env.SESSION_COOKIE_EMPLOYEE || "";
export const SESSION_COOKIE_MANAGER = process.env.SESSION_COOKIE_MANAGER || "";

if (SESSION_COOKIE_EMPLOYEE === "" || SESSION_COOKIE_MANAGER === "") {
  throw new Error(
    "The SESSION_COOKIE_EMPLOYEE and SESSION_COOKIE_MANAGER environment variables must have non-empty values in .env",
  );
}

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
