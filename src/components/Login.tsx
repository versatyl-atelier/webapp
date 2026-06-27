"use client";

import { useActionState, useEffect } from "react";
import { authenticateRole } from "@/app/actions/auth";
import { Role } from "@/generated/prisma/enums";
import { useRouter } from "next/navigation";

type LoginFormProps = {
  role?: Role;
};
export function LoginForm({ role = Role.employee }: LoginFormProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(authenticateRole, undefined);
  const isManager = role === Role.manager;

  useEffect(() => {
    if (state?.message === `${role} login success`) {
      router.back();
    }
  }, [state]);

  return (
    <form action={action}>
      <label htmlFor="password">
        {isManager ? "Mot de passe gestionnaire" : "Mot de passe employé"}
      </label>
      <input id="password" name="password" type="password" />
      {state?.errors?.password?.map((error) => (
        <p key={error}>- {error}</p>
      ))}
      <input
        id="role"
        name="role"
        type="hidden"
        value={isManager ? Role.manager : Role.employee}
      />
      <button type="submit" disabled={pending}>
        Vérifier le mot passe
      </button>
    </form>
  );
}
