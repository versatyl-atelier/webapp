"use client";

import { useEffect, useEffectEvent } from "react";

import { useSidebar } from "@/components/ui/sidebar";

export function OpenSidebarOnMount() {
  const { setOpen } = useSidebar();
  const openSidebar = useEffectEvent(() => setOpen(true));

  useEffect(() => {
    openSidebar();
  }, []);

  return null;
}
