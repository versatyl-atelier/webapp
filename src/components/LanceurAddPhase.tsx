"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { addLanceurPhase } from "@/actions/lanceur";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LANCEUR_ADD_PHASE_EMPTY_LABEL,
  LANCEUR_ADD_PHASE_LABEL,
  LANCEUR_NONE_VALUE,
} from "@/constants/lanceur";
import { notifyLanceurChange } from "@/hooks/use-lanceur-sync";
import { phaseLabel } from "@/lib/lanceur";

export type AvailablePhase = {
  phaseId: number;
  projectName: string;
  phaseName: string;
  phaseCount: number;
};

type LanceurAddPhaseProps = {
  phases: AvailablePhase[];
};

export function LanceurAddPhase({ phases }: LanceurAddPhaseProps) {
  const [pending, startTransition] = useTransition();

  function add(value: string | null) {
    if (value === null || value === LANCEUR_NONE_VALUE) {
      return;
    }
    startTransition(async () => {
      const result = await addLanceurPhase(Number(value));
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      notifyLanceurChange();
    });
  }

  return (
    <Select
      value={LANCEUR_NONE_VALUE}
      onValueChange={add}
      disabled={pending || phases.length === 0}
    >
      <SelectTrigger aria-label={LANCEUR_ADD_PHASE_LABEL} className="w-64">
        <SelectValue>
          {phases.length === 0
            ? LANCEUR_ADD_PHASE_EMPTY_LABEL
            : LANCEUR_ADD_PHASE_LABEL}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {phases.map((phase) => (
          <SelectItem key={phase.phaseId} value={String(phase.phaseId)}>
            {phaseLabel(phase)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
