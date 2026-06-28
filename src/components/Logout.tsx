"use client";

import { useActionState, useEffect } from "react";
import { logout } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { Role } from "@/generated/prisma/enums";

type LogoutFormProps = {
  role?: Role;
};
export function LogoutForm({ role = Role.employee }: LogoutFormProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(logout, undefined);
  const isManager = role === Role.manager;

  useEffect(() => {
    if (state?.message === "logoutSuccess") {
      router.push(`/login?role=${role}`);
    }
  }, [state, role, router]);
  return (
    <form action={action}>
      <input
        id="role"
        name="role"
        type="hidden"
        value={isManager ? Role.manager : Role.employee}
      />
      <button type="submit" disabled={pending}>
        Déconnexion
      </button>
    </form>
  );
}
