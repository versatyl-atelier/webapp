"use client";

import { EditDialog } from "@/components/EditDialog";
import { TaskForm } from "@/components/TaskForm";
import { EDIT_LABEL, EDIT_TASK_TITLE } from "@/constants/tasks";

type EditTaskDialogProps = {
  task: { id: number; name: string; color: string };
};

export function EditTaskDialog({ task }: EditTaskDialogProps) {
  return (
    <EditDialog title={EDIT_TASK_TITLE} label={`${EDIT_LABEL} ${task.name}`}>
      {(close) => <TaskForm task={task} onSaved={close} />}
    </EditDialog>
  );
}
