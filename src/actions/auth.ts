"use server";
import "server-only";

import { redirect } from "next/navigation";

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
  SwitchEmployeeFormSchema,
  SwitchEmployeeFormState,
  SwitchEmployeeFormErrors,
} from "@/schemas/auth.schemas";
import { LOGOUT_SUCCESS_MESSAGE } from "@/constants/auth";
import { HOME_PATH } from "@/constants/tools";
import { Role } from "@/generated/prisma/enums";
import { runEffectAsFormAction } from "@/lib/effect";
import { loginPath } from "@/lib/paths";
import {
  changePasswordEffect,
  createUserEffect,
  loginEffect,
  logoutEffect,
  switchEmployeeEffect,
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
  const state = await runEffectAsFormAction<
    LogoutFormState,
    typeof LogoutFormSchema,
    LogoutFormErrors
  >(formState, formData, LogoutFormSchema, logoutEffect);
  if (state?.message === LOGOUT_SUCCESS_MESSAGE) {
    redirect(loginPath(HOME_PATH));
  }
  return state;
}

export async function switchEmployee(
  formState: SwitchEmployeeFormState,
  formData: FormData,
): Promise<SwitchEmployeeFormState> {
  return runEffectAsFormAction<
    SwitchEmployeeFormState,
    typeof SwitchEmployeeFormSchema,
    SwitchEmployeeFormErrors
  >(formState, formData, SwitchEmployeeFormSchema, switchEmployeeEffect, [
    Role.employee,
  ]);
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
  >(formState, formData, CreateUserFormSchema, createUserEffect, [
    Role.manager,
  ]);
}
