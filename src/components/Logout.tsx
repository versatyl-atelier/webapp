"use client";

import { LogOut, User, UserShield, Users, type LucideIcon } from "lucide-react";
import { useActionState } from "react";

import { logout } from "@/actions/auth";
import { ActionTooltip } from "@/components/ActionTooltip";
import { Button } from "@/components/ui/button";
import { LOGOUT_LABEL, ROLE_LABELS } from "@/constants/auth";
import { Role } from "@/generated/prisma/enums";

const ROLE_ICONS: Record<Role, LucideIcon> = {
  [Role.employee]: User,
  [Role.manager]: UserShield,
  [Role.atelier]: Users,
};

type LogoutFormProps = {
  name: string;
  role: Role;
};
export function LogoutForm({ name, role }: LogoutFormProps) {
  const RoleIcon = ROLE_ICONS[role];
  const [, action, pending] = useActionState(logout, undefined);

  return (
    <form action={action} className="flex items-center gap-2">
      <RoleIcon aria-label={ROLE_LABELS[role]} className="size-4" />
      <span className="text-sm capitalize">{name}</span>
      <ActionTooltip
        label={LOGOUT_LABEL}
        render={
          <Button
            type="submit"
            disabled={pending}
            variant="destructive"
            aria-label={LOGOUT_LABEL}
          />
        }
      >
        <LogOut />
      </ActionTooltip>
    </form>
  );
}
