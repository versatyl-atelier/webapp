"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { SEARCH_PATH, SEARCH_SHORTCUT_KEY } from "@/constants/tools";

export function SearchShortcut() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isShortcut =
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        event.key.toLowerCase() === SEARCH_SHORTCUT_KEY;
      if (!isShortcut) {
        return;
      }
      event.preventDefault();
      if (pathname !== SEARCH_PATH) {
        router.push(SEARCH_PATH);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, pathname]);

  return null;
}
