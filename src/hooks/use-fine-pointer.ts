import { useSyncExternalStore } from "react";

import { FINE_POINTER_QUERY } from "@/constants/timeEntries";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(FINE_POINTER_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const getHasFinePointer = () => window.matchMedia(FINE_POINTER_QUERY).matches;

const getServerHasFinePointer = () => true;

export function useHasFinePointer(): boolean {
  return useSyncExternalStore(
    subscribe,
    getHasFinePointer,
    getServerHasFinePointer,
  );
}
