"use client";

import {
  COPY_DRAG_KEY_APPLE,
  COPY_DRAG_KEY_DEFAULT,
  DRAG_TO_COPY_HINT,
  DRAG_TO_MOVE_HINT,
  TOUCH_ENTRY_HINT,
} from "@/constants/timeEntries";
import { KBD_CLASSES } from "@/constants/tools";
import { useIsApplePlatform } from "@/hooks/use-apple-platform";
import { useHasFinePointer } from "@/hooks/use-fine-pointer";

export function TimeEntryDragHint() {
  const isApplePlatform = useIsApplePlatform();
  const hasFinePointer = useHasFinePointer();

  return (
    <p className="text-muted-foreground text-center text-xs">
      {hasFinePointer ? (
        <>
          {DRAG_TO_MOVE_HINT}
          {" (+ "}
          <kbd className={KBD_CLASSES}>
            {isApplePlatform ? COPY_DRAG_KEY_APPLE : COPY_DRAG_KEY_DEFAULT}
          </kbd>{" "}
          {DRAG_TO_COPY_HINT}
          {")"}
        </>
      ) : (
        TOUCH_ENTRY_HINT
      )}
    </p>
  );
}
