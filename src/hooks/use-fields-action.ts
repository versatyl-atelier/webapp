"use client";

import { useState, useTransition } from "react";

import { useFormToast, type ToastableState } from "@/hooks/use-form-toast";

export type FieldsAction = (
  state: undefined,
  formData: FormData,
) => Promise<ToastableState>;

export function useFieldsAction(
  action: FieldsAction,
  fields: Record<string, string>,
  onDone?: () => void,
) {
  const [state, setState] = useState<ToastableState>();
  const [pending, startTransition] = useTransition();
  useFormToast(state, { onSuccess: onDone });

  function run() {
    const formData = new FormData();
    Object.entries(fields).forEach(([name, value]) =>
      formData.set(name, value),
    );
    startTransition(async () => {
      setState(await action(undefined, formData));
    });
  }

  return { pending, run };
}
