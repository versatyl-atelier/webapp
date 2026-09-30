"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { updateObjectivesAndKilometrage } from "@/actions/objectivesAndKilometrage";
import { Button } from "@/components/ui/button";
import { FormValidationAlerts } from "@/components/FormValidationAlerts";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatTimeDisplay } from "@/lib/time";
import { useRouter } from "next/navigation";

export type ObjectivesAndKilometrageFormProps = {
  employeeId: number;
  weekStart: Date;
  currentObjective: number;
  currentKilometrage?: number;
  weekly: number;
  hoursDifference: number;
  disabled?: string;
};

export function ObjectivesAndKilometrageForm({
  employeeId,
  weekStart,
  currentObjective,
  currentKilometrage = 0,
  weekly,
  hoursDifference,
  disabled,
}: ObjectivesAndKilometrageFormProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    updateObjectivesAndKilometrage,
    undefined,
  );
  const isDifferencePositive = hoursDifference >= 0;

  useEffect(() => {
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
    <div className="bg-card rounded-lg border-2 p-2.5">
      <div className="border-primary mb-2 border-b-2 pb-1 text-center text-xs font-bold">
        Objectifs
      </div>
      <form action={action} className="space-y-2.5">
        <input type="hidden" name="employeeId" value={employeeId} />
        <input type="hidden" name="weekStart" value={weekStart.toString()} />
        <FormValidationAlerts errors={state?.errors} />
        <Field>
          <FieldLabel
            htmlFor="objective"
            className="mb-1 block text-xs font-semibold uppercase"
          >
            Objectif
          </FieldLabel>
          <Input
            id="objective"
            type="text"
            name="objective"
            defaultValue={formatTimeDisplay(currentObjective)}
            placeholder="Ex: 36.75 ou 36h 45m"
            disabled={pending || !!disabled}
            className="w-full rounded border-2 px-1.5 py-1 text-xs"
          />
        </Field>
        <div className="border-primary bg-muted space-y-1 rounded border-l-4 p-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs uppercase">
              Semaine
            </span>
            <span className="text-sm font-bold">
              {formatTimeDisplay(weekly)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs uppercase">
              Différence
            </span>
            <span
              className={`text-sm font-bold ${isDifferencePositive ? "text-punch-pos-diff" : "text-punch-neg-diff"}`}
            >
              {isDifferencePositive ? "+" : ""}
              {formatTimeDisplay(Math.abs(hoursDifference))}
            </span>
          </div>
        </div>
        <Field>
          <FieldLabel
            htmlFor="kilometrage"
            className="mb-1 block text-xs font-semibold uppercase"
          >
            Kilométrage
          </FieldLabel>
          <Input
            id="kilometrage"
            type="number"
            name="kilometrage"
            defaultValue={currentKilometrage}
            min="0"
            step="1"
            placeholder="Kilomètres"
            disabled={pending || !!disabled}
            className="w-full rounded border-2 px-1.5 py-1 text-xs"
          />
        </Field>
        <Button
          type="submit"
          disabled={pending || !!disabled}
          className="w-full rounded-sm py-2 text-xs font-semibold uppercase"
        >
          Sauver
        </Button>
        <Button
          type="reset"
          variant="secondary"
          disabled={pending || !!disabled}
          className="w-full rounded-sm py-2 text-xs font-semibold uppercase"
        >
          Annuler
        </Button>
      </form>
    </div>
  );
}
