"use client";

import { useActionState, useId, useRef } from "react";

import { addTask, editTask } from "@/actions/tasks";
import { FormValidationAlerts } from "@/components/FormValidationAlerts";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  ADD_LABEL,
  DEFAULT_TASK_COLOR,
  LUNCH_TASK_NAME,
  SAVE_LABEL,
  TASK_COLOR_LABEL,
  TASK_NAME_LABEL,
  TASK_NAME_MAX_LENGTH,
  TASK_NAME_PLACEHOLDER,
} from "@/constants/tasks";
import { useFormToast } from "@/hooks/use-form-toast";

type TaskFormProps = {
  task?: { id: number; name: string; color: string };
  onSaved?: () => void;
};

export function TaskForm({ task, onSaved }: TaskFormProps) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(
    task ? editTask : addTask,
    undefined,
  );

  useFormToast(state, {
    toastErrors: false,
    onSuccess: () => {
      if (!task) formRef.current?.reset();
      onSaved?.();
    },
  });

  return (
    <form ref={formRef} action={action} className="space-y-1.5">
      {task && <input type="hidden" name="taskId" value={task.id} />}
      <FormValidationAlerts errors={state?.errors} />
      {state?.errors?.taskId?.map((error: string) => (
        <FieldError key={error}>- {error}</FieldError>
      ))}
      <Field>
        <FieldLabel
          htmlFor={`${formId}-name`}
          className="mb-1 block text-xs font-semibold uppercase"
        >
          {TASK_NAME_LABEL}
        </FieldLabel>
        <Input
          id={`${formId}-name`}
          name="name"
          type="text"
          defaultValue={task?.name}
          placeholder={TASK_NAME_PLACEHOLDER}
          maxLength={TASK_NAME_MAX_LENGTH}
          readOnly={task?.name === LUNCH_TASK_NAME}
          disabled={pending}
          className="w-full rounded border-2 px-1.5 py-1 text-xs"
        />
        {state?.errors?.name?.map((error: string) => (
          <FieldError key={error}>- {error}</FieldError>
        ))}
      </Field>
      <Field>
        <FieldLabel
          htmlFor={`${formId}-color`}
          className="mb-1 block text-xs font-semibold uppercase"
        >
          {TASK_COLOR_LABEL}
        </FieldLabel>
        <Input
          id={`${formId}-color`}
          name="color"
          type="color"
          defaultValue={task?.color ?? DEFAULT_TASK_COLOR}
          disabled={pending}
          className="h-8 w-16 cursor-pointer rounded border-2 p-1"
        />
        {state?.errors?.color?.map((error: string) => (
          <FieldError key={error}>- {error}</FieldError>
        ))}
      </Field>
      <Button
        type="submit"
        size="sm"
        disabled={pending}
        className="w-full rounded-sm text-xs font-semibold uppercase"
      >
        {task ? SAVE_LABEL : ADD_LABEL}
      </Button>
    </form>
  );
}
