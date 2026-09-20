"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { changePassword } from "@/actions/auth";
import { FormValidationAlerts } from "@/components/FormValidationAlerts";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CHANGE_PASSWORD_SUCCESS_MESSAGE } from "@/constants/auth";
import { useAuthEvents } from "@/contexts/auth-events-provider";
import { loginPath } from "@/lib/paths";

type ChangePasswordFormProps = {
  redirectTo?: string;
};

export function ChangePasswordForm({ redirectTo }: ChangePasswordFormProps) {
  const router = useRouter();
  const { emitAuthSuccess } = useAuthEvents();
  const [state, action, pending] = useActionState(changePassword, undefined);

  useEffect(() => {
    if (state?.errors?.auth) {
      return router.push(loginPath(redirectTo));
    }
    if (state?.message === CHANGE_PASSWORD_SUCCESS_MESSAGE) {
      toast.success("Mot de passe modifié", { position: "top-left" });
      emitAuthSuccess();
      router.push(redirectTo || "/");
      return router.refresh();
    }
  }, [state, redirectTo, router, emitAuthSuccess]);

  return (
    <form action={action} className="flex w-full max-w-prose flex-col gap-2">
      <FormValidationAlerts errors={state?.errors} />
      <Field>
        <FieldLabel htmlFor="currentPassword">Mot de passe actuel</FieldLabel>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
        />
        <FieldError>
          {state?.errors?.currentPassword?.map((error) => (
            <p key={error}>- {error}</p>
          ))}
        </FieldError>
      </Field>
      <Field>
        <FieldLabel htmlFor="newPassword">Nouveau mot de passe</FieldLabel>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
        />
        <FieldError>
          {state?.errors?.newPassword?.map((error) => (
            <p key={error}>- {error}</p>
          ))}
        </FieldError>
      </Field>
      <Field>
        <FieldLabel htmlFor="confirmPassword">
          Confirmer le nouveau mot de passe
        </FieldLabel>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
        />
        <FieldError>
          {state?.errors?.confirmPassword?.map((error) => (
            <p key={error}>- {error}</p>
          ))}
        </FieldError>
      </Field>
      <Button type="submit" disabled={pending}>
        Changer le mot de passe
      </Button>
    </form>
  );
}
