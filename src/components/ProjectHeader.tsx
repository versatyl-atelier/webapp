"use client";

import { useActionState, useId, useState } from "react";
import { toast } from "sonner";

import { saveProjectHeader } from "@/actions/projects";
import { FieldErrors } from "@/components/FieldErrors";
import { FormValidationAlerts } from "@/components/FormValidationAlerts";
import { PinButton } from "@/components/PinButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CANCEL_LABEL,
  EDIT_LABEL,
  NO_PROJECT_STAGE_LABEL,
  NO_PROJECT_STAGE_VALUE,
  PROJECT_STAGE_LABEL,
  PROJECT_STAGE_LABELS,
  PROJECT_STAGES,
  PROJECT_TITLE_LABEL,
  PROJECT_TITLE_PLACEHOLDER,
  SAVE_LABEL,
  SAVED_TOAST_OPTIONS,
} from "@/constants/projects";
import type { ProjectFiche } from "@/lib/projects";
import type { ProjectHeaderFormState } from "@/schemas/projects.schemas";

const STAGE_ITEMS = {
  [NO_PROJECT_STAGE_VALUE]: NO_PROJECT_STAGE_LABEL,
  ...PROJECT_STAGE_LABELS,
};

type ProjectHeaderProps = {
  project: Pick<ProjectFiche, "id" | "name" | "stage" | "isManual">;
  pinned: boolean;
};

export function ProjectHeader({ project, pinned }: ProjectHeaderProps) {
  const formId = useId();
  const [editing, setEditing] = useState(false);
  const [stage, setStage] = useState<string>(
    project.stage ?? NO_PROJECT_STAGE_VALUE,
  );
  const [state, action, saving] = useActionState(
    async (formState: ProjectHeaderFormState, formData: FormData) => {
      const next = await saveProjectHeader(formState, formData);
      if (next?.message) {
        toast.success(next.message, SAVED_TOAST_OPTIONS);
        setEditing(false);
      }
      return next;
    },
    undefined,
  );
  const errors = state?.errors;

  const startEditing = () => {
    setStage(project.stage ?? NO_PROJECT_STAGE_VALUE);
    setEditing(true);
  };

  if (!editing) {
    return (
      <header className="flex items-start gap-4 border-b pb-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {project.name}
            </h1>
            {project.stage && (
              <Badge variant="secondary">
                <span className="sr-only">{PROJECT_STAGE_LABEL} : </span>
                {PROJECT_STAGE_LABELS[project.stage]}
              </Badge>
            )}
          </div>
        </div>
        <PinButton projectId={project.id} pinned={pinned} variant="outline" />
        <Button variant="outline" onClick={startEditing}>
          {EDIT_LABEL}
        </Button>
      </header>
    );
  }

  return (
    <form
      action={action}
      className="flex flex-col gap-4 border-b pb-4"
      aria-label={PROJECT_TITLE_LABEL}
    >
      <FormValidationAlerts errors={errors} />
      <input type="hidden" name="projectId" value={project.id} />
      <input type="hidden" name="stage" value={stage} />
      <Field>
        <FieldLabel htmlFor={`${formId}-name`}>
          {PROJECT_TITLE_LABEL}
        </FieldLabel>
        <Input
          id={`${formId}-name`}
          name="name"
          defaultValue={project.name}
          readOnly={!project.isManual}
          placeholder={PROJECT_TITLE_PLACEHOLDER}
          aria-invalid={!!errors?.name}
          className="h-10 text-lg font-semibold md:text-lg"
        />
        <FieldErrors errors={errors?.name} />
      </Field>
      <Field className="max-w-xs">
        <FieldLabel htmlFor={`${formId}-stage`}>
          {PROJECT_STAGE_LABEL}
        </FieldLabel>
        <Select
          items={STAGE_ITEMS}
          value={stage}
          onValueChange={(value) => {
            if (value !== null) {
              setStage(value);
            }
          }}
        >
          <SelectTrigger
            id={`${formId}-stage`}
            aria-invalid={!!errors?.stage}
            className="w-full"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_PROJECT_STAGE_VALUE}>
              {NO_PROJECT_STAGE_LABEL}
            </SelectItem>
            {PROJECT_STAGES.map((value) => (
              <SelectItem key={value} value={value}>
                {PROJECT_STAGE_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldErrors errors={errors?.stage} />
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
          {CANCEL_LABEL}
        </Button>
        <Button type="submit" disabled={saving}>
          {SAVE_LABEL}
        </Button>
      </div>
    </form>
  );
}
