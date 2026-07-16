"use client";

import { RefObject, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Role } from "@/generated/prisma/enums";
import { useAuthEvents } from "@/contexts/auth-events-provider";

const LOGIN_PATH = "/login";

export function useResubmitOnAuth(formRef: RefObject<HTMLFormElement | null>) {
  const { subscribeAuthSuccess } = useAuthEvents();
  const pendingRoleRef = useRef<Role | undefined>(undefined);
  const pathname = usePathname();

  useEffect(
    () =>
      subscribeAuthSuccess((role) => {
        if (pendingRoleRef.current === role) {
          pendingRoleRef.current = undefined;
          formRef.current?.requestSubmit();
        }
      }),
    [subscribeAuthSuccess, formRef],
  );

  useEffect(() => {
    if (pathname !== LOGIN_PATH) {
      pendingRoleRef.current = undefined;
    }
  }, [pathname]);

  return (role: Role) => {
    pendingRoleRef.current = role;
  };
}
