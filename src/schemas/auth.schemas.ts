import { Data, Schema } from "effect";

import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_CHANGE_REQUIRED_ERROR,
  SESSION_NOT_FOUND_ERROR,
} from "@/constants/auth";
import { Role } from "@/generated/prisma/client";
import { FormState } from "@/schemas/forms.schemas";

export type AppSession = {
  userId: string;
  name: string;
  role: Role;
  employeeId: number | null;
  mustChangePassword: boolean;
};

export const LoginFormSchema = Schema.Struct({
  email: Schema.String.pipe(Schema.minLength(1)),
  password: Schema.String.pipe(Schema.minLength(1)),
});

export type LoginFormErrors = {
  email?: string[];
  password?: string[];
};

export type LoginFormState =
  | (FormState & {
      errors?: LoginFormErrors;
      success?: boolean;
      mustChangePassword?: boolean;
    })
  | undefined;

export type LogoutFormState = FormState | undefined;

export const LogoutFormSchema = Schema.Struct({});

export const SwitchEmployeeFormSchema = Schema.Struct({
  employeeId: Schema.NumberFromString.pipe(Schema.int()),
});

export type SwitchEmployeeFormErrors = never;

export type SwitchEmployeeFormState =
  (FormState & { employeeId?: number; email?: string }) | undefined;

export type LogoutFormErrors = never;

export const ChangePasswordFormSchema = Schema.Struct({
  currentPassword: Schema.String.pipe(Schema.minLength(1)),
  newPassword: Schema.String.pipe(Schema.minLength(MIN_PASSWORD_LENGTH)),
  confirmPassword: Schema.String,
});

export type ChangePasswordFormErrors = {
  currentPassword?: string[];
  newPassword?: string[];
  confirmPassword?: string[];
};

export type ChangePasswordFormState =
  (FormState & { errors?: ChangePasswordFormErrors }) | undefined;

export const CreateUserFormSchema = Schema.Struct({
  email: Schema.String.pipe(Schema.minLength(1)),
  password: Schema.String.pipe(Schema.minLength(MIN_PASSWORD_LENGTH)),
  role: Schema.Enums(Role),
  employeeId: Schema.String,
  name: Schema.String,
});

export type CreateUserFormErrors = {
  email?: string[];
  password?: string[];
  role?: string[];
  employeeId?: string[];
  name?: string[];
};

export type CreateUserFormState =
  (FormState & { errors?: CreateUserFormErrors }) | undefined;

export class SessionNotFound extends Data.TaggedError(SESSION_NOT_FOUND_ERROR) {
  public toString() {
    return SESSION_NOT_FOUND_ERROR;
  }
}

export class PasswordChangeRequired extends Data.TaggedError(
  PASSWORD_CHANGE_REQUIRED_ERROR,
) {
  public toString() {
    return PASSWORD_CHANGE_REQUIRED_ERROR;
  }
}

export class Forbidden extends Data.TaggedError("Forbidden")<{
  readonly roles?: readonly Role[];
  readonly employeeId?: number | null;
  readonly projectId?: string;
}> {
  public toString() {
    return "Forbidden";
  }
}

export class AuthApiError extends Data.TaggedError("AuthApiError")<{
  readonly code: string | undefined;
  readonly status: string | number | undefined;
  readonly cause: unknown;
}> {}
