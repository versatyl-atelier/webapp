"use client";

import { useCallback, useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { removeLanceurPhase, updateLanceurPhase } from "@/actions/lanceur";
import { LANCEUR_SAVE_ERROR_MESSAGE } from "@/constants/lanceur";
import { notifyLanceurChange } from "@/hooks/use-lanceur-sync";
import {
  applyPatch,
  type LanceurEmployee,
  type LanceurRow,
} from "@/lib/lanceur";
import type { LanceurPatch } from "@/schemas/lanceur.schemas";

export type RowUpdate = { phaseId: number; patch: LanceurPatch };

const NO_EMPLOYEES: readonly LanceurEmployee[] = [];

export function useLanceurRows(
  rows: LanceurRow[],
  employees: readonly LanceurEmployee[] = NO_EMPLOYEES,
) {
  const [optimisticRows, applyOptimistic] = useOptimistic(
    rows,
    (current, { phaseId, patch }: RowUpdate) =>
      current.map((row) =>
        row.phaseId === phaseId ? applyPatch(row, patch, employees) : row,
      ),
  );
  const [pending, startTransition] = useTransition();

  const persist = useCallback(
    async (update: RowUpdate) => {
      applyOptimistic(update);
      try {
        const result = await updateLanceurPhase(update.phaseId, update.patch);
        if (result?.error) {
          toast.error(result.error);
          return false;
        }
        return true;
      } catch {
        toast.error(LANCEUR_SAVE_ERROR_MESSAGE);
        return false;
      }
    },
    [applyOptimistic],
  );

  const save = useCallback(
    (phaseId: number, patch: LanceurPatch) => {
      startTransition(async () => {
        if (await persist({ phaseId, patch })) {
          notifyLanceurChange();
        }
      });
    },
    [persist],
  );

  const saveMany = useCallback(
    (updates: readonly RowUpdate[], onDone?: () => void) => {
      startTransition(async () => {
        let allSaved = true;
        for (const update of updates) {
          allSaved = (await persist(update)) && allSaved;
        }
        notifyLanceurChange();
        if (allSaved) {
          onDone?.();
        }
      });
    },
    [persist],
  );

  const remove = useCallback((phaseId: number) => {
    startTransition(async () => {
      await removeLanceurPhase(phaseId);
      notifyLanceurChange();
    });
  }, []);

  return { rows: optimisticRows, pending, save, saveMany, remove };
}
