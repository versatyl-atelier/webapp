"use client";

import { useActionState, useId } from "react";

import { editPerson, removeAccount } from "@/actions/accounts";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
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
import {
  DISPLAY_ORDER_LABEL,
  EMAIL_EDITABLE_HINT,
  EMAIL_LABEL,
  EMAIL_LOCKED_HINT,
  MAX_DISPLAY_ORDER,
  NAME_LABEL,
  NO_STATUT_ID,
  NO_STATUT_LABEL,
  PERSON_NAME_MAX_LENGTH,
  REMOVE_ACCOUNT_DESCRIPTION,
  REMOVE_ACCOUNT_LABEL,
  ROLE_LABEL,
  STATUT_LABEL,
} from "@/constants/accounts";
import { ROLE_LABELS } from "@/constants/auth";
import { SAVE_LABEL } from "@/constants/tasks";
import { useFormToast } from "@/hooks/use-form-toast";
import { assignableRoles, type Person } from "@/lib/accounts";

const LABEL_CLASS = "mb-1 block text-xs font-semibold uppercase";
const INPUT_CLASS = "w-full rounded border-2 px-1.5 py-1 text-xs";
const SELECT_CLASS = "w-full rounded border-2 text-xs";
const HINT_CLASS = "text-muted-foreground mt-1 text-xs";

type PersonFormProps = {
  person: Person;
  statuts: { id: string; description: string }[];
  isCurrentUser: boolean;
  onSaved: () => void;
};

export function PersonForm({
  person,
  statuts,
  isCurrentUser,
  onSaved,
}: PersonFormProps) {
  const formId = useId();
  const [state, action, pending] = useActionState(editPerson, undefined);
  const statutItems = [
    { value: NO_STATUT_ID, label: NO_STATUT_LABEL },
    ...statuts.map(({ id, description }) => ({
      value: id,
      label: description,
    })),
  ];
  const isEmailLocked = !person.mustChangePassword;

  useFormToast(state, { toastErrors: false, onSuccess: onSaved });

  return (
    <div className="space-y-3">
      <form action={action} className="space-y-1.5">
        {person.employeeId !== null && (
          <input type="hidden" name="employeeId" value={person.employeeId} />
        )}
        {person.userId !== null && (
          <input type="hidden" name="userId" value={person.userId} />
        )}
        <FormValidationAlerts errors={state?.errors} />
        {state?.errors?.employeeId?.map((error) => (
          <FieldError key={error}>- {error}</FieldError>
        ))}
        {state?.errors?.userId?.map((error) => (
          <FieldError key={error}>- {error}</FieldError>
        ))}
        <Field>
          <FieldLabel htmlFor={`${formId}-name`} className={LABEL_CLASS}>
            {NAME_LABEL}
          </FieldLabel>
          <Input
            id={`${formId}-name`}
            name="name"
            type="text"
            defaultValue={person.name}
            maxLength={PERSON_NAME_MAX_LENGTH}
            disabled={pending}
            className={INPUT_CLASS}
          />
          {state?.errors?.name?.map((error) => (
            <FieldError key={error}>- {error}</FieldError>
          ))}
        </Field>
        {person.userId !== null && (
          <Field>
            <FieldLabel htmlFor={`${formId}-role`} className={LABEL_CLASS}>
              {ROLE_LABEL}
            </FieldLabel>
            <Select
              name="role"
              defaultValue={person.role ?? undefined}
              items={ROLE_LABELS}
              disabled={isCurrentUser}
            >
              <SelectTrigger id={`${formId}-role`} className={SELECT_CLASS}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assignableRoles(person.employeeId !== null).map((role) => (
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
        )}
        {person.employeeId !== null && (
          <>
            <Field>
              <FieldLabel htmlFor={`${formId}-statut`} className={LABEL_CLASS}>
                {STATUT_LABEL}
              </FieldLabel>
              <Select
                name="statutId"
                defaultValue={person.statutId ?? NO_STATUT_ID}
                items={statutItems}
              >
                <SelectTrigger id={`${formId}-statut`} className={SELECT_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statutItems.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state?.errors?.statutId?.map((error) => (
                <FieldError key={error}>- {error}</FieldError>
              ))}
            </Field>
            <Field>
              <FieldLabel htmlFor={`${formId}-order`} className={LABEL_CLASS}>
                {DISPLAY_ORDER_LABEL}
              </FieldLabel>
              <Input
                id={`${formId}-order`}
                name="displayOrder"
                type="number"
                min={0}
                max={MAX_DISPLAY_ORDER}
                step={1}
                defaultValue={person.displayOrder ?? undefined}
                disabled={pending}
                className={INPUT_CLASS}
              />
              {state?.errors?.displayOrder?.map((error) => (
                <FieldError key={error}>- {error}</FieldError>
              ))}
            </Field>
          </>
        )}
        {person.userId !== null && (
          <Field>
            <FieldLabel htmlFor={`${formId}-email`} className={LABEL_CLASS}>
              {EMAIL_LABEL}
            </FieldLabel>
            <Input
              id={`${formId}-email`}
              name="email"
              type="email"
              autoComplete="off"
              defaultValue={person.email ?? undefined}
              disabled={pending || isEmailLocked}
              aria-describedby={`${formId}-email-hint`}
              className={INPUT_CLASS}
            />
            <p id={`${formId}-email-hint`} className={HINT_CLASS}>
              {isEmailLocked ? EMAIL_LOCKED_HINT : EMAIL_EDITABLE_HINT}
            </p>
            {state?.errors?.email?.map((error) => (
              <FieldError key={error}>- {error}</FieldError>
            ))}
          </Field>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={pending}
          className="mt-3 w-full rounded-sm text-xs font-semibold uppercase"
        >
          {SAVE_LABEL}
        </Button>
      </form>
      {person.userId !== null && !isCurrentUser && (
        <ConfirmDeleteButton
          action={removeAccount}
          fields={{ userId: person.userId }}
          title={`${REMOVE_ACCOUNT_LABEL} de « ${person.name} » ?`}
          description={REMOVE_ACCOUNT_DESCRIPTION}
          label={`${REMOVE_ACCOUNT_LABEL} ${person.name}`}
          confirmLabel={REMOVE_ACCOUNT_LABEL}
          triggerText={REMOVE_ACCOUNT_LABEL}
          onDone={onSaved}
        />
      )}
    </div>
  );
}
