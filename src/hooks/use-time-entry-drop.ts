"use client";

import { startTransition, useActionState } from "react";

import { moveTimeEntry } from "@/actions/timeEntries";
import { UNDO_LABEL, UNDO_TOAST_DURATION_MS } from "@/constants/timeEntries";
import { useFormToast } from "@/hooks/use-form-toast";

export function useTimeEntryDrop() {
  const [state, action, pending] = useActionState(moveTimeEntry, undefined);

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

  return { submit, pending };
}
