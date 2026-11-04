"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export type ToastableState =
  | {
      message?: string;
      errors?: Record<string, string | string[] | undefined>;
    }
  | undefined;

type FormToastAction = {
  label: string;
  onClick: () => void;
};

type FormToastOptions = {
  toastErrors?: boolean;
  onSuccess?: () => void;
  action?: FormToastAction;
  duration?: number;
};

export function useFormToast(
  state: ToastableState,
  { toastErrors = true, onSuccess, action, duration }: FormToastOptions = {},
) {
  const router = useRouter();

  useEffect(() => {
    if (state?.message) {
      onSuccess?.();
      router.refresh();
      toast.success(state.message, {
        position: "top-left",
        icon: "✅",
        action,
        duration,
      });
      return;
    }
    if (!toastErrors) return;
    const error = Object.values(state?.errors ?? {})
      .flat()
      .find(Boolean);
    if (error) {
      toast.error(error, { position: "top-left" });
    }
  }, [state, router]);
}
