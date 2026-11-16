"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";

import { saveProjectColor } from "@/actions/projects";
import { ColorPicker } from "@/components/ColorPicker";
import { FieldErrors } from "@/components/FieldErrors";
import { FormValidationAlerts } from "@/components/FormValidationAlerts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CANCEL_LABEL,
  PROJECT_COLOR_DIALOG_DESCRIPTION,
  PROJECT_COLOR_LABEL,
  SAVE_LABEL,
  SAVED_TOAST_OPTIONS,
} from "@/constants/projects";
import type { ProjectColorFormState } from "@/schemas/projects.schemas";

type ProjectColorDialogProps = {
  projectId: string;
  color: string;
  onClose: () => void;
};

export function ProjectColorDialog({
  projectId,
  color: initialColor,
  onClose,
}: ProjectColorDialogProps) {
  const [color, setColor] = useState(initialColor);
  const [state, action, saving] = useActionState(
    async (formState: ProjectColorFormState, formData: FormData) => {
      const next = await saveProjectColor(formState, formData);
      if (next?.message) {
        toast.success(next.message, SAVED_TOAST_OPTIONS);
        onClose();
      }
      return next;
    },
    undefined,
  );
  const errors = state?.errors;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">{PROJECT_COLOR_LABEL}</DialogTitle>
          <DialogDescription>
            {PROJECT_COLOR_DIALOG_DESCRIPTION}
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          <FormValidationAlerts errors={errors} />
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="color" value={color} />
          <ColorPicker value={color} onChange={setColor} />
          <FieldErrors errors={errors?.color} />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              {CANCEL_LABEL}
            </Button>
            <Button type="submit" disabled={saving}>
              {SAVE_LABEL}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
