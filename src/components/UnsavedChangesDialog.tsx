"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  UNSAVED_CHANGES_DESCRIPTION,
  UNSAVED_CHANGES_DISCARD_LABEL,
  UNSAVED_CHANGES_SAVE_LABEL,
  UNSAVED_CHANGES_STAY_LABEL,
  UNSAVED_CHANGES_TITLE,
} from "@/constants/forms";

type UnsavedChangesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  onDiscard: () => void;
};

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onSave,
  onDiscard,
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{UNSAVED_CHANGES_TITLE}</AlertDialogTitle>
          <AlertDialogDescription>
            {UNSAVED_CHANGES_DESCRIPTION}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{UNSAVED_CHANGES_STAY_LABEL}</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            onClick={() => {
              onOpenChange(false);
              onDiscard();
            }}
          >
            {UNSAVED_CHANGES_DISCARD_LABEL}
          </AlertDialogAction>
          <AlertDialogAction
            type="button"
            onClick={() => {
              onOpenChange(false);
              onSave();
            }}
          >
            {UNSAVED_CHANGES_SAVE_LABEL}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
