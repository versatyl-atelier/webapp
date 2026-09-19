"use server";
import "server-only";

import {
  type ChangePasswordFormErrors,
  type ChangePasswordFormState,
  type CreateUserFormErrors,
  type CreateUserFormState,
  type LoginFormState,
  ChangePasswordFormSchema,
  CreateUserFormSchema,
  LoginFormSchema,
  LoginFormErrors,
  LogoutFormSchema,
  LogoutFormState,
  LogoutFormErrors,
} from "@/schemas/auth.schemas";
import { Role } from "@/generated/prisma/enums";
import { runEffectAsFormAction } from "@/lib/effect";
import {
  changePasswordEffect,
  createUserEffect,
  loginEffect,
  logoutEffect,
} from "@/effects/auth";

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

export async function changePassword(
  formState: ChangePasswordFormState,
  formData: FormData,
): Promise<ChangePasswordFormState> {
  return runEffectAsFormAction<
    ChangePasswordFormState,
    typeof ChangePasswordFormSchema,
    ChangePasswordFormErrors
  >(formState, formData, ChangePasswordFormSchema, changePasswordEffect);
}

export async function createUser(
  formState: CreateUserFormState,
  formData: FormData,
): Promise<CreateUserFormState> {
  return runEffectAsFormAction<
    CreateUserFormState,
    typeof CreateUserFormSchema,
    CreateUserFormErrors
  >(formState, formData, CreateUserFormSchema, createUserEffect, Role.manager);
}
