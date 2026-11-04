import { useSyncExternalStore } from "react";

import { getIsApplePlatform } from "@/hooks/use-apple-platform";

const listeners = new Set<() => void>();
let isPressed = false;

function setPressed(next: boolean) {
  if (next === isPressed) return;
  isPressed = next;
  listeners.forEach((listener) => listener());
}

function handleModifierEvent(event: KeyboardEvent | MouseEvent) {
  setPressed(getIsApplePlatform() ? event.altKey : event.ctrlKey);
}

function handleBlur() {
  setPressed(false);
}

function subscribe(onChange: () => void) {
  if (listeners.size === 0) {
    window.addEventListener("keydown", handleModifierEvent);
    window.addEventListener("keyup", handleModifierEvent);
    window.addEventListener("mousemove", handleModifierEvent);
    window.addEventListener("blur", handleBlur);
  }
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
    if (listeners.size > 0) return;
    window.removeEventListener("keydown", handleModifierEvent);
    window.removeEventListener("keyup", handleModifierEvent);
    window.removeEventListener("mousemove", handleModifierEvent);
    window.removeEventListener("blur", handleBlur);
  };
}

const getIsPressed = () => isPressed;

const getServerIsPressed = () => false;

export function useIsCopyModifierPressed(): boolean {
  return useSyncExternalStore(subscribe, getIsPressed, getServerIsPressed);
}
