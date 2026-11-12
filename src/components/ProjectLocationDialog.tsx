"use client";

import { useActionState, useId } from "react";
import { toast } from "sonner";

import { saveProjectLocation } from "@/actions/projects";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  CANCEL_LABEL,
  PROJECT_ADDRESS_LABEL,
  PROJECT_ADDRESS_PLACEHOLDER,
  PROJECT_CARD_DIALOG_DESCRIPTION,
  PROJECT_CARD_ROLE_LABEL,
  SAVE_LABEL,
  SAVED_TOAST_OPTIONS,
} from "@/constants/projects";

import type { ProjectLocationFormState } from "@/schemas/projects.schemas";

type ProjectLocationDialogProps = {
  projectId: string;
  address: string;
  onClose: () => void;
};

export function ProjectLocationDialog({
  projectId,
  address,
  onClose,
}: ProjectLocationDialogProps) {
  const formId = useId();
  const [state, action, saving] = useActionState(
    async (formState: ProjectLocationFormState, formData: FormData) => {
      const next = await saveProjectLocation(formState, formData);
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
          <DialogTitle className="text-lg">
            {PROJECT_CARD_ROLE_LABEL}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {PROJECT_CARD_DIALOG_DESCRIPTION}
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          <FormValidationAlerts errors={errors} />
          <input type="hidden" name="projectId" value={projectId} />
          <Field className="gap-1.5">
            <FieldLabel htmlFor={`${formId}-address`}>
              {PROJECT_ADDRESS_LABEL}
            </FieldLabel>
            <Input
              id={`${formId}-address`}
              name="address"
              defaultValue={address}
              placeholder={PROJECT_ADDRESS_PLACEHOLDER}
              aria-invalid={!!errors?.address}
            />
            <FieldErrors errors={errors?.address} />
          </Field>
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
