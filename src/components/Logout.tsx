"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { LOGOUT_SUCCESS_MESSAGE } from "@/constants/auth";

type LogoutFormProps = {
  name: string;
  redirectTo?: string;
};
export function LogoutForm({ name, redirectTo }: LogoutFormProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(logout, undefined);

  useEffect(() => {
    if (state?.message === LOGOUT_SUCCESS_MESSAGE) {
      router.push(redirectTo || "/");
      router.refresh();
    }
  }, [state, redirectTo, router]);

  return (
    <form action={action}>
      <span className="mr-2 text-sm capitalize">{name}</span>
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
