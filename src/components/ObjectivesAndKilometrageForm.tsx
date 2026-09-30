"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { updateObjectivesAndKilometrage } from "@/actions/objectivesAndKilometrage";
import { Button } from "@/components/ui/button";
import { FormValidationAlerts } from "@/components/FormValidationAlerts";
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
    <form
      action={action}
      className="bg-card grid h-fit w-full grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1.5 rounded-lg border-2 p-2.5"
    >
      <Input type="hidden" name="employeeId" value={employeeId} />
      <Input type="hidden" name="weekStart" value={weekStart.toString()} />

      <h2 className="text-lg font-bold">Objectifs</h2>
      <Input
        id="objective"
        type="text"
        name="objective"
        aria-label="Objectif"
        defaultValue={formatTimeDisplay(currentObjective)}
        placeholder="Ex: 36.75 ou 36h 45m"
        disabled={pending || !!disabled}
        className="w-24 rounded-sm border-2 text-end text-xs"
      />

      <div className="col-span-2">
        <FormValidationAlerts errors={state?.errors} />
      </div>

      <span className="text-muted-foreground text-xs">semaine</span>
      <span className="px-3 text-right text-xs font-bold">
        {formatTimeDisplay(weekly)}
      </span>

      <span className="text-muted-foreground text-xs">différence</span>
      <span
        className={`px-3 text-right text-xs font-bold ${isDifferencePositive ? "text-punch-pos-diff" : "text-punch-neg-diff"}`}
      >
        {isDifferencePositive ? "+" : ""}
        {formatTimeDisplay(Math.abs(hoursDifference))}
      </span>

      <label htmlFor="kilometrage" className="text-xs">
        Kilométrage
      </label>
      <Input
        id="kilometrage"
        type="number"
        name="kilometrage"
        defaultValue={currentKilometrage}
        min="0"
        step="1"
        placeholder="Kilomètres"
        disabled={pending || !!disabled}
        className="w-24 rounded-sm border-2 text-end text-xs"
      />

      <Button
        type="reset"
        variant="link"
        size="sm"
        disabled={pending || !!disabled}
      >
        Annuler
      </Button>
      <Button
        type="submit"
        disabled={pending || !!disabled}
        className="rounded-sm font-bold uppercase"
      >
        Sauver
      </Button>
    </form>
  );
}
