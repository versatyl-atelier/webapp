"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Role } from "@/generated/prisma/enums";

type LogoutFormProps = {
  role?: Role;
  redirectTo?: string;
};
export function LogoutForm({ role, redirectTo }: LogoutFormProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(logout, undefined);
  const isManager = role === Role.manager;
  const isEmployee = role === Role.employee;

  useEffect(() => {
    if (state?.message === "logoutSuccess") {
      router.push(redirectTo || "/");
    }
  }, [state, redirectTo, router]);

  return (
    <form action={action} className="flex max-w-prose flex-col gap-2">
      <Input
        id="role"
        name="role"
        type="hidden"
        value={
          isManager ? Role.manager : isEmployee ? Role.employee : ""
        }
      />
      <Button type="submit" disabled={pending} variant="destructive">
        Déconnexion
      </Button>
    </form>
  );
}

export function LogoutButton() {
  return (
    <Link href="/logout" title="Déconnextion">
      <LogOut />
    </Link>
  );
}
