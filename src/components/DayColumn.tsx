"use client";

import {
  startTransition,
  useActionState,
  useState,
  type DragEvent,
  type PropsWithChildren,
} from "react";

import { moveTimeEntry } from "@/actions/timeEntries";
import {
  COPY_COMMAND,
  DROP_COPY_CLASSES,
  DROP_MOVE_CLASSES,
  MOVE_COMMAND,
  TIME_ENTRY_DRAG_TYPE,
} from "@/constants/timeEntries";
import { useFormToast } from "@/hooks/use-form-toast";
import { cn } from "@/lib/utils";

type DropMode = typeof MOVE_COMMAND | typeof COPY_COMMAND;

type DayColumnProps = PropsWithChildren<{
  date: string;
  className?: string;
  disabled?: string;
}>;

function dropModeOf(event: DragEvent<HTMLDivElement>): DropMode {
  return event.ctrlKey ? COPY_COMMAND : MOVE_COMMAND;
}

export function DayColumn({
  date,
  className,
  disabled,
  children,
}: DayColumnProps) {
  const [state, action, pending] = useActionState(moveTimeEntry, undefined);
  const [dropMode, setDropMode] = useState<DropMode | null>(null);

  useFormToast(state);

  function acceptsDrop(event: DragEvent<HTMLDivElement>) {
    return !disabled && event.dataTransfer.types.includes(TIME_ENTRY_DRAG_TYPE);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (!acceptsDrop(event)) return;
    event.preventDefault();
    const mode = dropModeOf(event);
    event.dataTransfer.dropEffect = mode;
    setDropMode(mode);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setDropMode(null);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    if (!acceptsDrop(event)) return;
    event.preventDefault();
    setDropMode(null);

    const timeEntryId = event.dataTransfer.getData(TIME_ENTRY_DRAG_TYPE);
    if (!timeEntryId) return;

    const formData = new FormData();
    formData.set("timeEntryId", timeEntryId);
    formData.set("date", date);
    formData.set("command", dropModeOf(event));
    startTransition(() => action(formData));
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-busy={pending}
      className={cn(
        className,
        pending && "opacity-60",
        dropMode === MOVE_COMMAND && DROP_MOVE_CLASSES,
        dropMode === COPY_COMMAND && DROP_COPY_CLASSES,
      )}
    >
      {children}
    </div>
  );
}
