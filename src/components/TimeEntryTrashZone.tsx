"use client";

import { useState, type DragEvent, type PropsWithChildren } from "react";
import { Trash2 } from "lucide-react";

import {
  DELETE_COMMAND,
  DROP_DELETE_ACTIVE_CLASSES,
  DROP_DELETE_CLASSES,
  DROP_DELETE_LABEL,
  TIME_ENTRY_DRAG_TYPE,
  TIME_ENTRY_SOURCE_DATE_DRAG_TYPE,
} from "@/constants/timeEntries";
import { useIsDraggingTimeEntry } from "@/hooks/use-time-entry-dragging";
import { useTimeEntryDrop } from "@/hooks/use-time-entry-drop";
import { cn } from "@/lib/utils";

type TimeEntryTrashZoneProps = PropsWithChildren<{
  className?: string;
  disabled?: string;
}>;

export function TimeEntryTrashZone({
  className,
  disabled,
  children,
}: TimeEntryTrashZoneProps) {
  const { submit, pending } = useTimeEntryDrop();
  const isDragging = useIsDraggingTimeEntry();
  const [isOver, setIsOver] = useState(false);

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes(TIME_ENTRY_DRAG_TYPE)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setIsOver(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsOver(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsOver(false);

    const timeEntryId = event.dataTransfer.getData(TIME_ENTRY_DRAG_TYPE);
    if (!timeEntryId) return;

    submit({
      timeEntryId,
      date: event.dataTransfer.getData(TIME_ENTRY_SOURCE_DATE_DRAG_TYPE),
      command: DELETE_COMMAND,
    });
  }

  return (
    <div aria-busy={pending} className={cn("relative", className)}>
      {children}
      {isDragging && !disabled && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg backdrop-blur-sm transition-colors",
            DROP_DELETE_CLASSES,
            isOver && DROP_DELETE_ACTIVE_CLASSES,
          )}
        >
          <Trash2 aria-hidden className="size-16" />
          <span className="text-sm font-bold">{DROP_DELETE_LABEL}</span>
        </div>
      )}
    </div>
  );
}
