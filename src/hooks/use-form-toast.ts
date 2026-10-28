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

type FormToastOptions = {
  toastErrors?: boolean;
  onSuccess?: () => void;
};

export function useFormToast(
  state: ToastableState,
  { toastErrors = true, onSuccess }: FormToastOptions = {},
) {
  const router = useRouter();

  useEffect(() => {
    if (state?.message) {
      onSuccess?.();
      router.refresh();
      toast.success(state.message, { position: "top-left", icon: "✅" });
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
