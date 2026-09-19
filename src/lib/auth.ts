import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";

import {
  MIN_PASSWORD_LENGTH,
  SESSION_EXPIRES_IN_SECONDS,
  SESSION_UPDATE_AGE_SECONDS,
} from "@/constants/auth";
import { Role } from "@/generated/prisma/enums";
import { ac, roles } from "@/lib/permissions";
import prisma from "@/lib/prisma";

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error(
    "The BETTER_AUTH_SECRET environment variable must have a non-empty value in .env",
  );
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: MIN_PASSWORD_LENGTH,
  },
  session: {
    expiresIn: SESSION_EXPIRES_IN_SECONDS,
    updateAge: SESSION_UPDATE_AGE_SECONDS,
  },
  user: {
    additionalFields: {
      employeeId: { type: "number", required: false, input: false },
      mustChangePassword: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  plugins: [
    admin({
      ac,
      roles,
      adminRoles: [Role.manager],
      defaultRole: Role.employee,
    }),
    nextCookies(),
  ],
});
