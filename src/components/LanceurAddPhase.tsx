"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { addLanceurPhase } from "@/actions/lanceur";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LANCEUR_ADD_PHASE_EMPTY_LABEL,
  LANCEUR_ADD_PHASE_LABEL,
  LANCEUR_NONE_VALUE,
} from "@/constants/lanceur";
import { notifyLanceurChange } from "@/hooks/use-lanceur-sync";
import type { IntakeProject } from "@/lib/lanceurIntake";

type LanceurAddPhaseProps = {
  projects: IntakeProject[];
};

export function LanceurAddPhase({ projects }: LanceurAddPhaseProps) {
  const [pending, startTransition] = useTransition();
  const slots = projects.flatMap((project) =>
    project.slots.map((slot) => ({ projectId: project.id, slot })),
  );

  function add(key: string | null) {
    const target = slots.find(({ slot }) => slot.key === key);
    if (!target) {
      return;
    }
    startTransition(async () => {
      const result = await addLanceurPhase({
        projectId: target.projectId,
        phaseId: target.slot.phaseId,
      });
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
      disabled={pending || projects.length === 0}
    >
      <SelectTrigger aria-label={LANCEUR_ADD_PHASE_LABEL} className="w-64">
        <SelectValue>
          {projects.length === 0
            ? LANCEUR_ADD_PHASE_EMPTY_LABEL
            : LANCEUR_ADD_PHASE_LABEL}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {projects.map((project) =>
          project.slots.length > 1 ? (
            <SelectGroup key={project.id}>
              <SelectLabel>{project.name}</SelectLabel>
              {project.slots.map((slot) => (
                <SelectItem key={slot.key} value={slot.key}>
                  {slot.name}
                </SelectItem>
              ))}
            </SelectGroup>
          ) : (
            <SelectItem key={project.id} value={project.slots[0].key}>
              {project.name}
            </SelectItem>
          ),
        )}
      </SelectContent>
    </Select>
  );
}
