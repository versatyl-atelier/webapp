"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createUser } from "@/actions/auth";
import { FormValidationAlerts } from "@/components/FormValidationAlerts";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CREATE_USER_SUCCESS_MESSAGE, NO_EMPLOYEE_ID } from "@/constants/auth";
import { Role } from "@/generated/prisma/enums";

const ROLE_LABELS: Record<Role, string> = {
  [Role.employee]: "Employé",
  [Role.manager]: "Gestionnaire",
};
const NO_EMPLOYEE_LABEL = "Aucun employé";

type CreateUserFormProps = {
  employees: { id: number; name: string }[];
  className?: string;
};

export function CreateUserForm({ employees, className }: CreateUserFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(createUser, undefined);

  useEffect(() => {
    if (state?.message !== CREATE_USER_SUCCESS_MESSAGE) {
      return;
    }
    formRef.current?.reset();
    router.refresh();
    toast.success(state.message, { position: "top-left", icon: "✅" });
  }, [state, router]);

  return (
    <form ref={formRef} action={action} className={className}>
      <FormValidationAlerts errors={state?.errors} />
      <Field>
        <FieldLabel htmlFor="email">Courriel</FieldLabel>
        <Input id="email" name="email" type="email" autoComplete="off" />
        <FieldError>
          {state?.errors?.email?.map((error) => (
            <p key={error}>- {error}</p>
          ))}
        </FieldError>
      </Field>
      <Field>
        <FieldLabel htmlFor="password">Mot de passe temporaire</FieldLabel>
        <Input id="password" name="password" type="text" autoComplete="off" />
        <FieldError>
          {state?.errors?.password?.map((error) => (
            <p key={error}>- {error}</p>
          ))}
        </FieldError>
      </Field>
      <Field>
        <FieldLabel htmlFor="role">Rôle</FieldLabel>
        <Select name="role" defaultValue={Role.employee}>
          <SelectTrigger id="role" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(Role).map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError>
          {state?.errors?.role?.map((error) => (
            <p key={error}>- {error}</p>
          ))}
        </FieldError>
      </Field>
      <Field>
        <FieldLabel htmlFor="employeeId">Employé</FieldLabel>
        <Select name="employeeId" defaultValue={NO_EMPLOYEE_ID}>
          <SelectTrigger id="employeeId" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_EMPLOYEE_ID}>{NO_EMPLOYEE_LABEL}</SelectItem>
            {employees.map(({ id, name }) => (
              <SelectItem key={id} value={id.toString()}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError>
          {state?.errors?.employeeId?.map((error) => (
            <p key={error}>- {error}</p>
          ))}
        </FieldError>
      </Field>
      <Field>
        <FieldLabel htmlFor="name">Nom (si aucun employé)</FieldLabel>
        <Input id="name" name="name" type="text" autoComplete="off" />
        <FieldError>
          {state?.errors?.name?.map((error) => (
            <p key={error}>- {error}</p>
          ))}
        </FieldError>
      </Field>
      <Button type="submit" disabled={pending}>
        Créer le compte
      </Button>
    </form>
  );
}
