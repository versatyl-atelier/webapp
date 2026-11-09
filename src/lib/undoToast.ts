import { toast } from "sonner";

import { TOAST_UNDO_DURATION_MS, UNDO_LABEL } from "@/constants/projects";

export function undoToast(message: string, onUndo: () => void) {
  toast(message, {
    duration: TOAST_UNDO_DURATION_MS,
    action: { label: UNDO_LABEL, onClick: onUndo },
  });
}
