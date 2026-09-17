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
  disabled?: string;
};

export function ObjectivesAndKilometrageForm({
  employeeId,
  weekStart,
  currentObjective,
  currentKilometrage = 0,
  disabled,
}: ObjectivesAndKilometrageFormProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    updateObjectivesAndKilometrage,
    undefined,
  );

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
    <div className="border-punch-dark w-full rounded-lg border-2 bg-white p-2.5">
      <form
        action={action}
        className="bg-punch-light space-y-3 rounded-sm border-2 border-dashed p-2"
      >
        <Input type="hidden" name="employeeId" value={employeeId} />
        <Input type="hidden" name="weekStart" value={weekStart.toString()} />

        <FormValidationAlerts errors={state?.errors} />

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
              disabled={pending || !!disabled}
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
              disabled={pending || !!disabled}
              className="rounded-sm border-2 border-black bg-white text-center text-xs"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={pending || !!disabled}
          className="hover:bg-punch-accent w-full rounded-sm bg-black font-bold text-white uppercase disabled:opacity-50"
        >
          Sauver
        </Button>
      </form>
    </div>
  );
}
