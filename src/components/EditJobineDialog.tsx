"use client";

import { EditDialog } from "@/components/EditDialog";
import { JobineForm } from "@/components/JobineForm";
import { EDIT_JOBINE_TITLE } from "@/constants/jobines";
import { EDIT_LABEL } from "@/constants/tasks";
import type { JobineRecord } from "@/lib/jobines";

type EditJobineDialogProps = {
  jobine: Pick<JobineRecord, "id" | "name" | "description" | "color">;
};

export function EditJobineDialog({ jobine }: EditJobineDialogProps) {
  return (
    <EditDialog
      title={EDIT_JOBINE_TITLE}
      label={`${EDIT_LABEL} ${jobine.name}`}
    >
      {(close) => <JobineForm jobine={jobine} onSaved={close} />}
    </EditDialog>
  );
}
