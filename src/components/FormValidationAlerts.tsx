"use client";

import { TriangleAlert } from "lucide-react";
import { useState } from "react";

import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";

export type FormValidationErrors = {
  schemaValidation?: string;
  dataValidation?: string;
};

type DismissibleAlertProps = {
  message: string;
  alertClassName?: string;
  iconClassName?: string;
  descriptionClassName?: string;
};

function DismissibleAlert({
  message,
  alertClassName,
  iconClassName,
  descriptionClassName,
}: DismissibleAlertProps) {
  const [dismissedMessage, setDismissedMessage] = useState<string | null>(
    null,
  );
  if (dismissedMessage === message) return null;

  return (
    <FieldError>
      <Alert className={alertClassName}>
        <TriangleAlert className={iconClassName} />
        <AlertDescription className={descriptionClassName}>
          {message}
        </AlertDescription>
        <AlertAction className="top-1">
          <Button onClick={() => setDismissedMessage(message)}>x</Button>
        </AlertAction>
      </Alert>
    </FieldError>
  );
}

export type FormValidationAlertsProps = {
  errors?: FormValidationErrors;
  className?: string;
};

export function FormValidationAlerts({
  errors,
  className,
}: FormValidationAlertsProps) {
  if (!errors?.schemaValidation && !errors?.dataValidation) return null;

  return (
    <FieldGroup className={className}>
      {errors.schemaValidation && (
        <DismissibleAlert
          message={errors.schemaValidation}
          iconClassName="text-amber-500"
          descriptionClassName="bg-black text-white"
        />
      )}
      {errors.dataValidation && (
        <DismissibleAlert
          message={errors.dataValidation}
          alertClassName="border-punch-accent rounded-sm border-2 bg-black text-white"
          iconClassName="fill-amber-400 stroke-black"
          descriptionClassName="font-bold"
        />
      )}
    </FieldGroup>
  );
}
