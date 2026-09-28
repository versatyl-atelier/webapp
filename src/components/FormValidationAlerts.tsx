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
};

function DismissibleAlert({ message }: DismissibleAlertProps) {
  const [dismissedMessage, setDismissedMessage] = useState<string | null>(null);
  if (dismissedMessage === message) return null;

  return (
    <FieldError>
      <Alert variant="destructive">
        <TriangleAlert />
        <AlertDescription>{message}</AlertDescription>
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
        <DismissibleAlert message={errors.schemaValidation} />
      )}
      {errors.dataValidation && (
        <DismissibleAlert message={errors.dataValidation} />
      )}
    </FieldGroup>
  );
}
