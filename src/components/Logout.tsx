"use client";

import { LogOut, User, UserShield, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { LOGOUT_SUCCESS_MESSAGE, ROLE_LABELS } from "@/constants/auth";
import { Role } from "@/generated/prisma/enums";

const ROLE_ICONS: Record<Role, LucideIcon> = {
  [Role.employee]: User,
  [Role.manager]: UserShield,
};

type LogoutFormProps = {
  name: string;
  role: Role;
  redirectTo?: string;
};
export function LogoutForm({ name, role, redirectTo }: LogoutFormProps) {
  const router = useRouter();
  const RoleIcon = ROLE_ICONS[role];
  const [state, action, pending] = useActionState(logout, undefined);

  useEffect(() => {
    if (state?.message === LOGOUT_SUCCESS_MESSAGE) {
      router.push(redirectTo || "/");
      router.refresh();
    }
  }, [state, redirectTo, router]);

  return (
    <form action={action} className="flex items-center gap-2">
      <RoleIcon aria-label={ROLE_LABELS[role]} className="size-4" />
      <span className="text-sm capitalize">{name}</span>
      <Button
        type="submit"
        disabled={pending}
        variant="destructive"
        title="Déconnexion"
      >
        <LogOut />
      </Button>
    </form>
  );
}
