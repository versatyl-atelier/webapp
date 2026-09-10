"use server";
import "server-only";

import {
  type LoginFormState,
  LoginFormSchema,
  LoginFormErrors,
  LogoutFormSchema,
  LogoutFormState,
  LogoutFormErrors,
} from "@/schemas/auth.schemas";
import { runEffectAsFormAction } from "@/lib/effect";
import { loginEffect, logoutEffect } from "@/effects/auth";

export async function login(
  formState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  return runEffectAsFormAction<
    LoginFormState,
    typeof LoginFormSchema,
    LoginFormErrors
  >(formState, formData, LoginFormSchema, loginEffect);
}

export async function logout(
  formState: LogoutFormState,
  formData: FormData,
): Promise<LogoutFormState> {
  return runEffectAsFormAction<
    LogoutFormState,
    typeof LogoutFormSchema,
    LogoutFormErrors
  >(formState, formData, LogoutFormSchema, logoutEffect);
}
