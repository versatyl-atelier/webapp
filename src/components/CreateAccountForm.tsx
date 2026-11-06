"use client";

import { useActionState, useId } from "react";

import { createUser } from "@/actions/auth";
import { FormValidationAlerts } from "@/components/FormValidationAlerts";
import { TemporaryPasswordNotice } from "@/components/TemporaryPasswordNotice";
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
import {
  CREATE_ACCOUNT_SUBMIT_LABEL,
  EMAIL_LABEL,
  EMPLOYEE_LABEL,
  NAME_WITHOUT_EMPLOYEE_LABEL,
  PERSON_NAME_MAX_LENGTH,
  ROLE_LABEL,
} from "@/constants/accounts";
import {
  NO_EMPLOYEE_ID,
  NO_EMPLOYEE_LABEL,
  ROLE_LABELS,
} from "@/constants/auth";
import { Role } from "@/generated/prisma/enums";
import { assignableRoles } from "@/lib/accounts";
import { useFormToast } from "@/hooks/use-form-toast";

const LABEL_CLASS = "mb-1 block text-xs font-semibold uppercase";
const INPUT_CLASS = "w-full rounded border-2 px-1.5 py-1 text-xs";
const SELECT_CLASS = "w-full rounded border-2 text-xs";

type CreateAccountFormProps = {
  employees?: { id: number; name: string }[];
  employee?: { id: number; name: string };
  onDone: () => void;
};

export function CreateAccountForm({
  employees = [],
  employee,
  onDone,
}: CreateAccountFormProps) {
  const formId = useId();
  const [state, action, pending] = useActionState(createUser, undefined);
  const roles = employee ? assignableRoles(true) : Object.values(Role);
  const employeeItems = [
    { value: NO_EMPLOYEE_ID, label: NO_EMPLOYEE_LABEL },
    ...employees.map(({ id, name }) => ({ value: String(id), label: name })),
  ];

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
    <form action={action} className="space-y-1.5">
      {employee && (
        <>
          <input type="hidden" name="employeeId" value={employee.id} />
          <input type="hidden" name="name" value={employee.name} />
        </>
      )}
      <FormValidationAlerts errors={state?.errors} />
      {employee &&
        state?.errors?.employeeId?.map((error) => (
          <FieldError key={error}>- {error}</FieldError>
        ))}
      <Field>
        <FieldLabel htmlFor={`${formId}-email`} className={LABEL_CLASS}>
          {EMAIL_LABEL}
        </FieldLabel>
        <Input
          id={`${formId}-email`}
          name="email"
          type="email"
          autoComplete="off"
          disabled={pending}
          className={INPUT_CLASS}
        />
        {state?.errors?.email?.map((error) => (
          <FieldError key={error}>- {error}</FieldError>
        ))}
      </Field>
      <Field>
        <FieldLabel htmlFor={`${formId}-role`} className={LABEL_CLASS}>
          {ROLE_LABEL}
        </FieldLabel>
        <Select name="role" defaultValue={Role.employee} items={ROLE_LABELS}>
          <SelectTrigger id={`${formId}-role`} className={SELECT_CLASS}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state?.errors?.role?.map((error) => (
          <FieldError key={error}>- {error}</FieldError>
        ))}
      </Field>
      {!employee && (
        <>
          <Field>
            <FieldLabel htmlFor={`${formId}-employee`} className={LABEL_CLASS}>
              {EMPLOYEE_LABEL}
            </FieldLabel>
            <Select
              name="employeeId"
              defaultValue={NO_EMPLOYEE_ID}
              items={employeeItems}
            >
              <SelectTrigger id={`${formId}-employee`} className={SELECT_CLASS}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {employeeItems.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.errors?.employeeId?.map((error) => (
              <FieldError key={error}>- {error}</FieldError>
            ))}
          </Field>
          <Field>
            <FieldLabel htmlFor={`${formId}-name`} className={LABEL_CLASS}>
              {NAME_WITHOUT_EMPLOYEE_LABEL}
            </FieldLabel>
            <Input
              id={`${formId}-name`}
              name="name"
              type="text"
              autoComplete="off"
              maxLength={PERSON_NAME_MAX_LENGTH}
              disabled={pending}
              className={INPUT_CLASS}
            />
            {state?.errors?.name?.map((error) => (
              <FieldError key={error}>- {error}</FieldError>
            ))}
          </Field>
        </>
      )}
      <Button
        type="submit"
        size="sm"
        disabled={pending}
        className="w-full rounded-sm text-xs font-semibold uppercase"
      >
        {CREATE_ACCOUNT_SUBMIT_LABEL}
      </Button>
    </form>
  );
}
