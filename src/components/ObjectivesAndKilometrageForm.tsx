"use client";

import { TriangleAlert } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { updateObjectivesAndKilometrage } from "@/app/actions/objectivesAndKilometrage";
import { Alert, AlertDescription, AlertAction } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import formatTimeDisplay from "@/lib/formatTimeDisplay";
import { useRouter } from "next/navigation";

export type ObjectivesAndKilometrageFormProps = {
  employeeId: number;
  weekStart: Date;
  currentObjective: number;
  currentKilometrage?: number;
};

export function ObjectivesAndKilometrageForm({
  employeeId,
  weekStart,
  currentObjective,
  currentKilometrage = 0,
}: ObjectivesAndKilometrageFormProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    updateObjectivesAndKilometrage,
    undefined,
  );
  const [hideSchemaValidationError, setHideSchemaValidationError] =
    useState(false);
  const [hideDataValidationError, setHideDataValidationError] = useState(false);

  useEffect(() => {
    setHideSchemaValidationError(false);
    setHideDataValidationError(false);
    if (state?.message === "Objectif et kilométrage sauvegardés!") {
      toast.success("Objectif et kilométrage sauvegardés!", {
        duration: 3000,
        position: "top-left",
        icon: "✅",
      });
      router.refresh();
    }
  }, [state]);

  return (
    <div className="border-punch-dark w-full rounded-lg border-2 bg-white p-2.5">
      <form
        action={action}
        className="bg-punch-light space-y-3 rounded-sm border-2 border-dashed p-2"
      >
        <Input type="hidden" name="employeeId" value={employeeId} />
        <Input type="hidden" name="weekStart" value={weekStart.toString()} />

        <FieldGroup>
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

        <div className="space-y-2">
          <div>
            <label className="mb-3 block text-center text-xs font-bold">
              Objectif
            </label>
            <Input
              type="text"
              name="objective"
              defaultValue={formatTimeDisplay(currentObjective)}
              placeholder="Ex: 36.75 ou 36h 45m"
              disabled={pending}
              className="rounded-sm border-2 border-black bg-white text-center text-xs"
            />
          </div>

          <div>
            <label className="mb-3 block text-center text-xs font-bold">
              Kilométrage
            </label>
            <Input
              type="number"
              name="kilometrage"
              defaultValue={currentKilometrage}
              min="0"
              step="1"
              placeholder="Kilomètres"
              disabled={pending}
              className="rounded-sm border-2 border-black bg-white text-center text-xs"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="hover:bg-punch-accent w-full rounded-sm bg-black font-bold text-white uppercase disabled:opacity-50"
        >
          {"Sauver"}
        </Button>
      </form>
    </div>
  );
}
