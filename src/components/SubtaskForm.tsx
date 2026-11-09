"use client";

import { useActionState, useId, useRef } from "react";

import { addSubtask, editSubtask } from "@/actions/tasks";
import { FormValidationAlerts } from "@/components/FormValidationAlerts";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  ADD_LABEL,
  SAVE_LABEL,
  SUBTASK_NAME_LABEL,
  SUBTASK_NAME_MAX_LENGTH,
  SUBTASK_NAME_PLACEHOLDER,
} from "@/constants/tasks";
import { useFormToast } from "@/hooks/use-form-toast";

type SubtaskFormProps = {
  subtask?: { id: string; name: string };
  onSaved?: () => void;
};

export function SubtaskForm({ subtask, onSaved }: SubtaskFormProps) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(
    subtask ? editSubtask : addSubtask,
    undefined,
  );

  useFormToast(state, {
    toastErrors: false,
    onSuccess: () => {
      if (!subtask) formRef.current?.reset();
      onSaved?.();
    },
  });

  return (
    <form ref={formRef} action={action} className="space-y-1.5">
      {subtask && <input type="hidden" name="id" value={subtask.id} />}
      <FormValidationAlerts errors={state?.errors} />
      {state?.errors?.id?.map((error: string) => (
        <FieldError key={error}>- {error}</FieldError>
      ))}
      <Field>
        <FieldLabel
          htmlFor={`${formId}-name`}
          className="mb-1 block text-xs font-semibold uppercase"
        >
          {SUBTASK_NAME_LABEL}
        </FieldLabel>
        <Input
          id={`${formId}-name`}
          name="name"
          type="text"
          defaultValue={subtask?.name}
          placeholder={SUBTASK_NAME_PLACEHOLDER}
          maxLength={SUBTASK_NAME_MAX_LENGTH}
          disabled={pending}
          className="w-full rounded border-2 px-1.5 py-1 text-xs"
        />
        {state?.errors?.name?.map((error: string) => (
          <FieldError key={error}>- {error}</FieldError>
        ))}
      </Field>
      <Button
        type="submit"
        size="sm"
        disabled={pending}
        className="w-full rounded-sm text-xs font-semibold uppercase"
      >
        {subtask ? SAVE_LABEL : ADD_LABEL}
      </Button>
    </form>
  );
}
