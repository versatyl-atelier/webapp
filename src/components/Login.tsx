"use client";

import { LogIn } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect } from "react";
import { login } from "@/actions/auth";
import { useRouter } from "next/navigation";
import { useAuthEvents } from "@/contexts/auth-events-provider";
import { LOGIN_SUCCESS_MESSAGE } from "@/constants/auth";
import { changePasswordPath, loginPath } from "@/lib/paths";
import { Field, FieldError, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

type LoginFormProps = {
  redirectTo?: string;
  defaultEmail?: string;
};
export function LoginForm({ redirectTo, defaultEmail }: LoginFormProps) {
  const router = useRouter();
  const { emitAuthSuccess } = useAuthEvents();
  const [state, action, pending] = useActionState(login, undefined);

  useEffect(() => {
    if (state?.message !== LOGIN_SUCCESS_MESSAGE) {
      return;
    }
    if (state.mustChangePassword) {
      return router.push(changePasswordPath(redirectTo));
    }
    emitAuthSuccess();
    if (redirectTo) {
      router.push(redirectTo);
    } else {
      router.back();
    }
    router.refresh();
  }, [state, redirectTo, router, emitAuthSuccess]);

  return (
    <form action={action} className="flex max-w-prose flex-col gap-2">
      <Field>
        <FieldLabel htmlFor="email">Courriel</FieldLabel>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={defaultEmail}
        />
        <FieldError>
          {state?.errors?.email?.map((error) => (
            <p key={error}>- {error}</p>
          ))}
        </FieldError>
      </Field>
      <Field>
        <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
        />
        <FieldError>
          {state?.errors?.password?.map((error) => (
            <p key={error}>- {error}</p>
          ))}
        </FieldError>
      </Field>

      <Button type="submit" disabled={pending}>
        Se connecter
      </Button>
    </form>
  );
}

export function LoginButton() {
  return (
    <Link href={loginPath()} title="Connexion">
      <LogIn />
    </Link>
  );
}
