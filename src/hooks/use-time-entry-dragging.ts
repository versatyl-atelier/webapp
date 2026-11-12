import { useSyncExternalStore } from "react";

import { TIME_ENTRY_DRAG_TYPE } from "@/constants/timeEntries";

const listeners = new Set<() => void>();
let isDragging = false;

function setDragging(next: boolean) {
  if (next === isDragging) return;
  isDragging = next;
  listeners.forEach((listener) => listener());
}

function handleDragStart(event: DragEvent) {
  setDragging(!!event.dataTransfer?.types.includes(TIME_ENTRY_DRAG_TYPE));
}

function handleDragStop() {
  setDragging(false);
}

function subscribe(onChange: () => void) {
  if (listeners.size === 0) {
    window.addEventListener("dragstart", handleDragStart);
    window.addEventListener("dragend", handleDragStop);
    window.addEventListener("drop", handleDragStop);
  }
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
    if (listeners.size > 0) return;
    window.removeEventListener("dragstart", handleDragStart);
    window.removeEventListener("dragend", handleDragStop);
    window.removeEventListener("drop", handleDragStop);
  };
}

const getIsDragging = () => isDragging;

const getServerIsDragging = () => false;

export function useIsDraggingTimeEntry(): boolean {
  return useSyncExternalStore(subscribe, getIsDragging, getServerIsDragging);
}
