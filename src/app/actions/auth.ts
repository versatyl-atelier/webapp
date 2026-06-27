"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import z from "zod";

import {
  decrypt,
  createSession,
  deleteSession,
  getCookieName,
} from "@/lib/session";
import { PASSWORDS } from "@/constants/auth";

import {
  type LoginFormState,
  LoginFormSchema,
  LogoutFormSchema,
  LogoutFormState,
} from "./auth.schemas";
import { Role } from "@/generated/prisma/enums";

export async function authenticateRole(
  formState: LoginFormState,
  formData: FormData,
) {
  const validatedFields = LoginFormSchema.safeParse({
    password: formData.get("password"),
    role: formData.get("role"),
  });
  const { success, data } = validatedFields;
  if (!success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { password, role } = data as { password: string; role: Role };

  const rolePassword = process.env[PASSWORDS[role]];

  if (password !== rolePassword) {
    return { success: false, error: "Mauvais mot de passe" };
  }

  await createSession(role);
  return { success: true, message: `${role} login success` };
}

export const verifySession = cache(async (role: Role) => {
  const cookie = (await cookies()).get(getCookieName(role))?.value;
  const session = await decrypt(cookie);

  if (!session) {
    return redirect(`/login?role=${role}`);
  }

  return { isAuth: true, role };
});

export async function logout(
  formState: LogoutFormState,
  formData: FormData,
): Promise<LogoutFormState> {
  const validatedFields = LogoutFormSchema.safeParse({
    role: formData.get("role"),
  });
  const { success, data, error } = validatedFields;
  if (!success) {
    return {
      errors: {
        ...validatedFields.error.flatten().fieldErrors,
        schemaValidation: error.toString(),
      },
    };
  }

  const { role } = data;

  await deleteSession(role);

  return {
    message: "logoutSuccess",
  };
}

export async function restrictToRole<T>(role: Role, cb: () => Promise<T>) {
  await verifySession(role);
  return cb();
}
