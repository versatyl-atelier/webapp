"use client";

import { RefObject, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { LOGIN_PATH } from "@/constants/auth";
import { useAuthEvents } from "@/contexts/auth-events-provider";

export function useResubmitOnAuth(formRef: RefObject<HTMLFormElement | null>) {
  const { subscribeAuthSuccess } = useAuthEvents();
  const pendingRef = useRef(false);
  const pathname = usePathname();

  useEffect(
    () =>
      subscribeAuthSuccess(() => {
        if (pendingRef.current) {
          pendingRef.current = false;
          formRef.current?.requestSubmit();
        }
      }),
    [subscribeAuthSuccess, formRef],
  );

  useEffect(() => {
    if (pathname !== LOGIN_PATH) {
      pendingRef.current = false;
    }
  }, [pathname]);

  return () => {
    pendingRef.current = true;
  };
}
