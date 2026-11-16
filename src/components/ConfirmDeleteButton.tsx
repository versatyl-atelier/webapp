"use client";

import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";

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
import { ActionTooltip } from "@/components/ActionTooltip";
import { Button } from "@/components/ui/button";
import { ACTION_TONE_CLASSES } from "@/constants/actions";
import { CANCEL_LABEL, DELETE_LABEL } from "@/constants/tasks";
import { useFieldsAction, type FieldsAction } from "@/hooks/use-fields-action";

type ConfirmDeleteButtonProps = {
  action: FieldsAction;
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
  const { pending, run } = useFieldsAction(action, fields, onDone);

  return (
    <AlertDialog>
      {triggerText ? (
        <AlertDialogTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              className="text-destructive w-full rounded-sm text-xs font-semibold uppercase"
            />
          }
        >
          {triggerText}
        </AlertDialogTrigger>
      ) : (
        <ActionTooltip
          label={label}
          render={
            <AlertDialogTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={label}
                  disabled={pending}
                  className={ACTION_TONE_CLASSES.destructive}
                />
              }
            />
          }
        >
          {icon}
        </ActionTooltip>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{CANCEL_LABEL}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={run}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
