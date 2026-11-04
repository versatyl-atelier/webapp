"use client";

import { Plus } from "lucide-react";
import { useActionState, useId, useState } from "react";

import { createProject } from "@/actions/projects";
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
import { SidebarMenuButton } from "@/components/ui/sidebar";
import {
  CANCEL_LABEL,
  CREATE_PROJECT_LABEL,
  NEW_PROJECT_DIALOG_DESCRIPTION,
  NEW_PROJECT_LABEL,
  PROJECT_TITLE_LABEL,
  PROJECT_TITLE_PLACEHOLDER,
} from "@/constants/projects";
import type { ProjectCreateFormState } from "@/schemas/projects.schemas";

type NewProjectDialogProps = {
  onClose: () => void;
};

function NewProjectDialog({ onClose }: NewProjectDialogProps) {
  const nameId = useId();
  const [state, action, creating] = useActionState(
    (formState: ProjectCreateFormState, formData: FormData) =>
      createProject(formState, formData),
    undefined,
  );
  const errors = state?.errors;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">{NEW_PROJECT_LABEL}</DialogTitle>
          <DialogDescription>
            {NEW_PROJECT_DIALOG_DESCRIPTION}
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          <FormValidationAlerts errors={errors} />
          <Field className="gap-1.5">
            <FieldLabel htmlFor={nameId}>{PROJECT_TITLE_LABEL}</FieldLabel>
            <Input
              id={nameId}
              name="name"
              placeholder={PROJECT_TITLE_PLACEHOLDER}
              autoFocus
              aria-invalid={!!errors?.name}
            />
            <FieldErrors errors={errors?.name} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              {CANCEL_LABEL}
            </Button>
            <Button type="submit" disabled={creating}>
              {CREATE_PROJECT_LABEL}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewProjectButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <SidebarMenuButton
        render={<Button variant="default" />}
        onClick={() => setOpen(true)}
      >
        <Plus />
        {NEW_PROJECT_LABEL}
      </SidebarMenuButton>
      {open && <NewProjectDialog onClose={() => setOpen(false)} />}
    </>
  );
}
