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
  DROP_COPY_LABEL,
  DROP_COPY_LABEL_CLASSES,
  DROP_MOVE_CLASSES,
  DROP_MOVE_LABEL,
  DROP_MOVE_LABEL_CLASSES,
  MOVE_COMMAND,
  TIME_ENTRY_DRAG_TYPE,
  TIME_ENTRY_SOURCE_DATE_DRAG_TYPE,
  UNDO_LABEL,
  UNDO_TOAST_DURATION_MS,
} from "@/constants/timeEntries";
import { useIsApplePlatform } from "@/hooks/use-apple-platform";
import { useFormToast } from "@/hooks/use-form-toast";
import { cn } from "@/lib/utils";

type DropMode = typeof MOVE_COMMAND | typeof COPY_COMMAND;

type DayColumnProps = PropsWithChildren<{
  date: string;
  className?: string;
  disabled?: string;
}>;

const DROP_LABELS: Record<DropMode, { label: string; className: string }> = {
  [MOVE_COMMAND]: {
    label: DROP_MOVE_LABEL,
    className: DROP_MOVE_LABEL_CLASSES,
  },
  [COPY_COMMAND]: {
    label: DROP_COPY_LABEL,
    className: DROP_COPY_LABEL_CLASSES,
  },
};

function dropModeOf(
  event: DragEvent<HTMLElement>,
  isApplePlatform: boolean,
): DropMode {
  const copyKeyPressed = isApplePlatform ? event.altKey : event.ctrlKey;
  return copyKeyPressed ? COPY_COMMAND : MOVE_COMMAND;
}

export function DayColumn({
  date,
  className,
  disabled,
  children,
}: DayColumnProps) {
  const [state, action, pending] = useActionState(moveTimeEntry, undefined);
  const [dropMode, setDropMode] = useState<DropMode | null>(null);
  const isApplePlatform = useIsApplePlatform();

  function submit(fields: Record<string, string>) {
    const formData = new FormData();
    Object.entries(fields).forEach(([name, value]) =>
      formData.set(name, value),
    );
    startTransition(() => action(formData));
  }

  const undo = state?.undo;
  useFormToast(state, {
    action: undo && { label: UNDO_LABEL, onClick: () => submit(undo) },
    duration: undo && UNDO_TOAST_DURATION_MS,
  });

  function acceptsDrop(event: DragEvent<HTMLDivElement>) {
    return !disabled && event.dataTransfer.types.includes(TIME_ENTRY_DRAG_TYPE);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (!acceptsDrop(event)) return;
    event.preventDefault();
    const mode = dropModeOf(event, isApplePlatform);
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

    submit({
      timeEntryId,
      date,
      sourceDate: event.dataTransfer.getData(TIME_ENTRY_SOURCE_DATE_DRAG_TYPE),
      command: dropModeOf(event, isApplePlatform),
    });
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-busy={pending}
      className={cn(
        "relative",
        className,
        pending && "opacity-60",
        dropMode === MOVE_COMMAND && DROP_MOVE_CLASSES,
        dropMode === COPY_COMMAND && DROP_COPY_CLASSES,
      )}
    >
      {children}
      {dropMode && (
        <span
          className={cn(
            "bg-card/90 text-2xs pointer-events-none absolute inset-x-0.5 bottom-0.5 rounded-sm py-0.5 text-center font-bold",
            DROP_LABELS[dropMode].className,
          )}
        >
          {DROP_LABELS[dropMode].label}
        </span>
      )}
    </div>
  );
}
