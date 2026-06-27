"use client";

import { useActionState, useEffect } from "react";
import { logout } from "@/app/actions/auth";
import { useRouter } from "next/navigation";

export function LogoutForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(logout, undefined);

  useEffect(() => {
    if (state?.message === "logoutSuccess") {
      router.back();
    }
  }, [state]);
  return (
    <form action={action}>
      <button type="submit" disabled={pending}>
        Déconnexion
      </button>
    </form>
  );
}
