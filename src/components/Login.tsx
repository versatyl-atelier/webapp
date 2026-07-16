"use client";

import { useActionState, useEffect } from "react";
import { login } from "@/app/actions/auth";
import { Role } from "@/generated/prisma/enums";
import { useRouter } from "next/navigation";
import { useAuthEvents } from "@/contexts/auth-events-provider";
import { Field, FieldError, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

type LoginFormProps = {
  role?: Role;
  redirectTo?: string;
};
export function LoginForm({
  role = Role.employee,
  redirectTo,
}: LoginFormProps) {
  const router = useRouter();
  const { emitAuthSuccess } = useAuthEvents();
  const [state, action, pending] = useActionState(login, undefined);
  const isManager = role === Role.manager;

  useEffect(() => {
    if (state?.message === `${role} login success`) {
      emitAuthSuccess(role);
      return redirectTo ? router.push(redirectTo) : router.back();
    }
  }, [state, role, redirectTo, router, emitAuthSuccess]);

  return (
    <form action={action} className="flex max-w-prose flex-col gap-2">
      <Input
        id="role"
        name="role"
        type="hidden"
        value={isManager ? Role.manager : Role.employee}
      />
      <Field>
        <FieldLabel htmlFor="password">
          {isManager ? "Mot de passe gestionnaire" : "Mot de passe employé"}
        </FieldLabel>

        <Input id="password" name="password" type="password" />
        <FieldError>
          {state?.errors?.password?.map((error) => (
            <p key={error}>- {error}</p>
          ))}
        </FieldError>
      </Field>

      <Button type="submit" disabled={pending}>
        Vérifier le mot passe
      </Button>
    </form>
  );
}
