"use server";
import "server-only";

import { Effect } from "effect";

import { createSession, deleteSession } from "@/lib/session";
import { PASSWORDS } from "@/constants/auth";

import {
  type LoginFormState,
  LoginFormSchema,
  LoginFormErrors,
  LogoutFormSchema,
  LogoutFormState,
  LogoutFormErrors,
} from "./auth.schemas";
import { Role } from "@/generated/prisma/enums";
import { runEffectAsFormAction } from "@/lib/effect";

export async function login(
  formState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  return runEffectAsFormAction<
    LoginFormState,
    typeof LoginFormSchema,
    LoginFormErrors
  >(
    formState,
    formData,
    LoginFormSchema,
    (
      formState: LoginFormState,
      { password, role }: Record<string, FormDataEntryValue | null>,
    ) =>
      Effect.gen(function* () {
        const rolePassword = process.env[PASSWORDS[role as Role]];

        if (password !== rolePassword) {
          yield* Effect.succeed({
            success: false,
            errors: {
              password: "Mauvais mot de passe",
            },
          });
        }

        yield* createSession(role as Role);
        return { success: true, message: `${role as Role} login success` };
      }),
  );
}

export async function logout(
  formState: LogoutFormState,
  formData: FormData,
): Promise<LogoutFormState> {
  return runEffectAsFormAction<
    LogoutFormState,
    typeof LogoutFormSchema,
    LogoutFormErrors
  >(
    formState,
    formData,
    LogoutFormSchema,
    (
      formState: LogoutFormState,
      { role }: Record<string, FormDataEntryValue | null>,
    ) =>
      Effect.gen(function* () {
        if (role) {
          yield* deleteSession(role as Role);
        } else {
          yield* deleteSession(Role.employee);
          yield* deleteSession(Role.manager);
        }
        return {
          success: true,
          message: "logoutSuccess",
        };
      }),
  );
}
