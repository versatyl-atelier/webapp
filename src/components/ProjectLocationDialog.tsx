"use client";

import { useActionState, useId, useState } from "react";
import { toast } from "sonner";

import { saveProjectLocation } from "@/actions/projects";
import { ActionTooltip } from "@/components/ActionTooltip";
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
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  CANCEL_LABEL,
  PROJECT_ADDRESS_LABEL,
  PROJECT_ADDRESS_PLACEHOLDER,
  PROJECT_CARD_DIALOG_DESCRIPTION,
  PROJECT_CARD_ROLE_LABEL,
  PROJECT_COLOR_LABEL,
  SAVE_LABEL,
  SAVED_TOAST_OPTIONS,
} from "@/constants/projects";
import { projectColorOptions, projectColorStyle } from "@/lib/projects";
import type { ProjectLocationFormState } from "@/schemas/projects.schemas";

type ProjectLocationDialogProps = {
  projectId: string;
  color: string;
  address: string;
  onClose: () => void;
};

export function ProjectLocationDialog({
  projectId,
  color: initialColor,
  address,
  onClose,
}: ProjectLocationDialogProps) {
  const formId = useId();
  const [color, setColor] = useState(initialColor);
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
          <input type="hidden" name="color" value={color} />
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
          <FieldSet>
            <FieldLegend variant="label">{PROJECT_COLOR_LABEL}</FieldLegend>
            <RadioGroup
              value={color}
              onValueChange={setColor}
              className="flex flex-wrap gap-2"
            >
              {projectColorOptions(initialColor).map(({ value, label }) => (
                <ActionTooltip
                  key={value}
                  label={label}
                  render={
                    <RadioGroupItem
                      value={value}
                      aria-label={label}
                      style={projectColorStyle(value)}
                      className="data-checked:ring-foreground data-checked:ring-offset-background size-6 border-0 bg-(--project-color) text-white data-checked:bg-(--project-color) data-checked:ring-2 data-checked:ring-offset-2 dark:bg-(--project-color) dark:data-checked:bg-(--project-color)"
                    />
                  }
                />
              ))}
            </RadioGroup>
            <FieldErrors errors={errors?.color} />
          </FieldSet>
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
