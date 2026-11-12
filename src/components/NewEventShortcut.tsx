"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { CALENDAR_EVENTS_PATH } from "@/constants/calendar";
import {
  ENTER_KEY,
  INTERACTIVE_ELEMENT_SELECTOR,
  OPEN_DIALOG_SELECTOR,
} from "@/constants/keys";
import { newCalendarEventPath } from "@/lib/calendar";

function isShortcut(event: KeyboardEvent): boolean {
  return (
    event.key === ENTER_KEY &&
    !event.repeat &&
    !event.isComposing &&
    !event.defaultPrevented &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    !(
      event.target instanceof Element &&
      event.target.closest(INTERACTIVE_ELEMENT_SELECTOR)
    ) &&
    !document.querySelector(OPEN_DIALOG_SELECTOR)
  );
}

export function NewEventShortcut() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith(CALENDAR_EVENTS_PATH)) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isShortcut(event)) {
        return;
      }
      event.preventDefault();
      router.push(newCalendarEventPath());
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, pathname]);

  return null;
}
