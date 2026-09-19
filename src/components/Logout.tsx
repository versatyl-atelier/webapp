"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { LOGOUT_SUCCESS_MESSAGE } from "@/constants/auth";

type LogoutFormProps = {
  redirectTo?: string;
};
export function LogoutForm({ redirectTo }: LogoutFormProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(logout, undefined);

  useEffect(() => {
    if (state?.message === LOGOUT_SUCCESS_MESSAGE) {
      router.push(redirectTo || "/");
      router.refresh();
    }
  }, [state, redirectTo, router]);

  return (
    <form action={action} className="flex max-w-prose flex-col gap-2">
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
