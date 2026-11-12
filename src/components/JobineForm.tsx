"use client";

import { useActionState, useId, useRef, useState } from "react";

import { addJobine, editJobine } from "@/actions/jobines";
import { ColorPicker } from "@/components/ColorPicker";
import { FieldErrors } from "@/components/FieldErrors";
import { FormValidationAlerts } from "@/components/FormValidationAlerts";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_JOBINE_COLOR,
  JOBINE_COLOR_LABEL,
  JOBINE_DESCRIPTION_LABEL,
  JOBINE_DESCRIPTION_MAX_LENGTH,
  JOBINE_DESCRIPTION_PLACEHOLDER,
  JOBINE_DESCRIPTION_ROWS,
  JOBINE_NAME_LABEL,
  JOBINE_NAME_MAX_LENGTH,
  JOBINE_NAME_PLACEHOLDER,
} from "@/constants/jobines";
import { ADD_LABEL, SAVE_LABEL } from "@/constants/tasks";
import { useFormToast } from "@/hooks/use-form-toast";
import type { JobineRecord } from "@/lib/jobines";

const LABEL_CLASS = "mb-1 block text-xs font-semibold uppercase";

type JobineFormProps = {
  jobine?: Pick<JobineRecord, "id" | "name" | "description" | "color">;
  onSaved?: () => void;
};

export function JobineForm({ jobine, onSaved }: JobineFormProps) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const initialColor = jobine?.color ?? DEFAULT_JOBINE_COLOR;
  const [color, setColor] = useState(initialColor);
  const [state, action, pending] = useActionState(
    jobine ? editJobine : addJobine,
    undefined,
  );

  useFormToast(state, {
    toastErrors: false,
    onSuccess: () => {
      if (!jobine) {
        formRef.current?.reset();
        setColor(initialColor);
      }
      onSaved?.();
    },
  });

  return (
    <form ref={formRef} action={action} className="space-y-1.5">
      {jobine && <input type="hidden" name="jobineId" value={jobine.id} />}
      <input type="hidden" name="color" value={color} />
      <FormValidationAlerts errors={state?.errors} />
      <FieldErrors errors={state?.errors?.jobineId} />
      <Field>
        <FieldLabel htmlFor={`${formId}-name`} className={LABEL_CLASS}>
          {JOBINE_NAME_LABEL}
        </FieldLabel>
        <Input
          id={`${formId}-name`}
          name="name"
          type="text"
          required
          defaultValue={jobine?.name}
          placeholder={JOBINE_NAME_PLACEHOLDER}
          maxLength={JOBINE_NAME_MAX_LENGTH}
          disabled={pending}
          className="w-full rounded border-2 px-1.5 py-1 text-xs"
        />
        <FieldErrors errors={state?.errors?.name} />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${formId}-description`} className={LABEL_CLASS}>
          {JOBINE_DESCRIPTION_LABEL}
        </FieldLabel>
        <Textarea
          id={`${formId}-description`}
          name="description"
          rows={JOBINE_DESCRIPTION_ROWS}
          defaultValue={jobine?.description}
          placeholder={JOBINE_DESCRIPTION_PLACEHOLDER}
          maxLength={JOBINE_DESCRIPTION_MAX_LENGTH}
          disabled={pending}
          className="w-full rounded border-2 px-1.5 py-1 text-xs md:text-xs"
        />
        <FieldErrors errors={state?.errors?.description} />
      </Field>
      <FieldSet>
        <FieldLegend variant="label" className={LABEL_CLASS}>
          {JOBINE_COLOR_LABEL}
        </FieldLegend>
        <ColorPicker value={color} onChange={setColor} />
        <FieldErrors errors={state?.errors?.color} />
      </FieldSet>
      <Button
        type="submit"
        size="sm"
        disabled={pending}
        className="w-full rounded-sm text-xs font-semibold uppercase"
      >
        {jobine ? SAVE_LABEL : ADD_LABEL}
      </Button>
    </form>
  );
}
