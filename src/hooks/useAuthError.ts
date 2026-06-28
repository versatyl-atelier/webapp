"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isAuthError } from "@/lib/auth";

export function useAuthError(state: unknown) {
  const router = useRouter();

  useEffect(() => {
    if (isAuthError(state)) {
      router.push(`/login?role=${state.role}`);
    }
  }, [state, router]);
}
