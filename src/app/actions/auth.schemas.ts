import { Role } from "@/generated/prisma/client";
import { z } from "zod";

export type SessionPayload = {
  expiresAt: Date;
};

export const LoginFormSchema = z.object({
  password: z.string().min(1, "Mot de passe requis"),
  role: z.nativeEnum(Role),
});

export type LoginFormState =
  | {
      errors?: {
        password?: string[];
        role?: string[];
      };
      message?: string;
    }
  | undefined;

export type LogoutFormState =
  | {
      errors?: {
        role?: string[];
        schemaValidation?: string;
        dataValidation?: string;
      };
      message?: string;
    }
  | undefined;

export const LogoutFormSchema = z.object({
  role: z.nativeEnum(Role),
});
