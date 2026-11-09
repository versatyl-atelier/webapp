"use client";

import { useActionState } from "react";

import { resetPassword } from "@/actions/accounts";
import { FormValidationAlerts } from "@/components/FormValidationAlerts";
import { TemporaryPasswordNotice } from "@/components/TemporaryPasswordNotice";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import {
  RESET_PASSWORD_DESCRIPTION,
  RESET_PASSWORD_SUBMIT_LABEL,
} from "@/constants/accounts";
import { useFormToast } from "@/hooks/use-form-toast";

type ResetPasswordFormProps = {
  userId: string;
  onDone: () => void;
};

export function ResetPasswordForm({ userId, onDone }: ResetPasswordFormProps) {
  const [state, action, pending] = useActionState(resetPassword, undefined);

  useFormToast(state, { toastErrors: false });

  if (state?.temporaryPassword) {
    return (
      <TemporaryPasswordNotice
        password={state.temporaryPassword}
        onDone={onDone}
      />
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="userId" value={userId} />
      <FormValidationAlerts errors={state?.errors} />
      {state?.errors?.userId?.map((error) => (
        <FieldError key={error}>- {error}</FieldError>
      ))}
      <p className="text-sm">{RESET_PASSWORD_DESCRIPTION}</p>
      <Button
        type="submit"
        size="sm"
        disabled={pending}
        className="w-full rounded-sm text-xs font-semibold uppercase"
      >
        {RESET_PASSWORD_SUBMIT_LABEL}
      </Button>
    </form>
  );
}
