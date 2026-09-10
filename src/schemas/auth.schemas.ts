import { Schema } from "effect";

import { Role } from "@/generated/prisma/client";
import { FormState } from "@/schemas/forms.schemas";
import { Data } from "effect";

export type SessionPayload = {
  expiresAt: Date;
};

export const LoginFormSchema = Schema.Struct({
  password: Schema.String.pipe(Schema.minLength(1)),
  role: Schema.Enums(Role),
});

export type LoginFormErrors = {
  password?: string[];
  role?: string[];
};

export type LoginFormState =
  | (FormState & {
      errors?: LoginFormErrors;
      success?: boolean;
      error?: string;
    })
  | undefined;

export type LogoutFormState = FormState | undefined;

export const LogoutFormSchema = Schema.Struct({
  role: Schema.Union(Schema.Enums(Role), Schema.Literal("")),
});

export type LogoutFormErrors = never;

export class SessionNotFound extends Data.TaggedError("SessionNotFound")<{
  readonly role: Role;
}> {
  public toString() {
    return `SessionNotFound:${this.role}`;
  }
}
