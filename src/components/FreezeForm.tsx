"use client";

import { TriangleAlert } from "lucide-react";
import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { freezeWeek } from "@/app/actions/frozenWeeks";
import dino from "@/app/employee/[id]/dino.gif";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  AlertAction,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FreezeWeekFormState } from "@/app/actions/frozenWeeks.schemas";
import { useRouter } from "next/navigation";

export type FreezeFormProps = {
  employeeId: number;
  weekStart: Date;
  weekTotal: number;
  objective: number;
  weekFrozen: boolean;
};

export function FreezeForm({
  employeeId,
  weekStart,
  weekTotal,
  objective,
  weekFrozen,
}: FreezeFormProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(freezeWeek, undefined);
  const [hideSchemaValidationError, setHideSchemaValidationError] =
    useState(false);
  const [hideDataValidationError, setHideDataValidationError] = useState(false);
  useEffect(() => {
    setHideSchemaValidationError(false);
    setHideDataValidationError(false);
    if (state?.message === "freezeSuccess") {
      router.refresh();
      toast.success("Semain gelée!", {
        description: "La semaine a été gelée avec succès.",
        duration: 5000,
        position: "top-left",
        icon: "🎉",
        action: (
          <Image
            src={dino}
            alt="Celebration"
            width={60}
            unoptimized
            className="mx-auto mb-3.5"
          />
        ),
      });
    } else if (state?.message === "unfreezeSuccess") {
      router.refresh();
      toast.success("Semaine dégelée!", {
        duration: 5000,
        position: "top-left",
        icon: "✅",
      });
    }
  }, [state]);

  return (
    <form action={action}>
      <Input type="hidden" name="employeeId" value={employeeId} />
      <Input type="hidden" name="weekStart" value={weekStart.toString()} />
      <Input type="hidden" name="weekTotal" value={weekTotal} />
      <Input type="hidden" name="objective" value={objective} />
      <Input type="hidden" name="frozen" value={weekFrozen ? 1 : 0} />
      <FieldGroup className="fixed top-16 left-4 w-5/6">
        {state?.errors?.schemaValidation && !hideSchemaValidationError && (
          <FieldError>
            <Alert>
              <TriangleAlert className="text-amber-500" />
              <AlertDescription className="bg-black text-white">
                {state.errors.schemaValidation}
              </AlertDescription>
              <AlertAction>
                <Button onClick={() => setHideSchemaValidationError(true)}>
                  x
                </Button>
              </AlertAction>
            </Alert>
          </FieldError>
        )}
        {state?.errors?.dataValidation && !hideDataValidationError && (
          <FieldError>
            <Alert className="border-punch-accent rounded-sm border-2 bg-black text-white">
              <TriangleAlert className="fill-amber-400 stroke-black" />
              <AlertDescription className="font-bold">
                {state.errors.dataValidation}
              </AlertDescription>
              <AlertAction>
                <Button onClick={() => setHideDataValidationError(true)}>
                  x
                </Button>
              </AlertAction>
            </Alert>
          </FieldError>
        )}
      </FieldGroup>

      <Button
        type="submit"
        disabled={pending}
        className={`text-2xs bg-punch-accent hover:bg-punch-accent-hover rounded-sm font-bold text-white disabled:opacity-50 sm:px-2`}
      >
        {weekFrozen ? "Dégeler" : "Geler"}
      </Button>
    </form>
  );
}
