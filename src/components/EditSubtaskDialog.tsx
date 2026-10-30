"use client";

import { EditDialog } from "@/components/EditDialog";
import { SubtaskForm } from "@/components/SubtaskForm";
import { EDIT_LABEL, EDIT_SUBTASK_TITLE } from "@/constants/tasks";

type EditSubtaskDialogProps = {
  subtask: { id: string; name: string };
};

export function EditSubtaskDialog({ subtask }: EditSubtaskDialogProps) {
  return (
    <EditDialog
      title={EDIT_SUBTASK_TITLE}
      label={`${EDIT_LABEL} ${subtask.name}`}
    >
      {(close) => <SubtaskForm subtask={subtask} onSaved={close} />}
    </EditDialog>
  );
}
