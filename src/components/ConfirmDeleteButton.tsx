"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition, type ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CANCEL_LABEL, DELETE_LABEL } from "@/constants/tasks";
import { useFormToast, type ToastableState } from "@/hooks/use-form-toast";

type ConfirmDeleteButtonProps = {
  action: (state: undefined, formData: FormData) => Promise<ToastableState>;
  fields: Record<string, string>;
  title: string;
  description?: string;
  label: string;
  confirmLabel?: string;
  icon?: ReactNode;
  triggerText?: string;
  onDone?: () => void;
};

export function ConfirmDeleteButton({
  action,
  fields,
  title,
  description,
  label,
  confirmLabel = DELETE_LABEL,
  icon = <Trash2 />,
  triggerText,
  onDone,
}: ConfirmDeleteButtonProps) {
  const [state, setState] = useState<ToastableState>();
  const [pending, startTransition] = useTransition();
  useFormToast(state, { onSuccess: onDone });

  function handleConfirm() {
    const formData = new FormData();
    Object.entries(fields).forEach(([name, value]) =>
      formData.set(name, value),
    );
    startTransition(async () => {
      setState(await action(undefined, formData));
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          triggerText ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              className="text-destructive w-full rounded-sm text-xs font-semibold uppercase"
            />
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={label}
              disabled={pending}
            />
          )
        }
      >
        {triggerText ?? icon}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{CANCEL_LABEL}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
