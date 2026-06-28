import { Role } from "@/generated/prisma/client";
import { z } from "zod";
import { FormState } from "./FormState";

export type AuthErrorState = {
  error: "auth_required";
  role: Role;
};

export type SessionPayload = {
  expiresAt: Date;
};

export const LoginFormSchema = z.object({
  password: z.string().min(1, "Mot de passe requis"),
  role: z.nativeEnum(Role),
});

export type LoginFormState = (FormState & {
  errors?: {
    password?: string[];
    role?: string[];
  };
  success?: boolean;
  error?: string;
}) | undefined;

export type LogoutFormState = (FormState & {
  errors?: {
    role?: string[];
  };
}) | undefined;

export const LogoutFormSchema = z.object({
  role: z.nativeEnum(Role),
});
