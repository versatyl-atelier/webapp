"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { getLanceurLog } from "@/actions/lanceur";
import { LanceurIntakeFields } from "@/components/LanceurIntakeFields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LANCEUR_LOCALE } from "@/constants/lanceur";
import {
  DIALOG_DESCRIPTION,
  DIALOG_GENERAL_TAB,
  DIALOG_LOG_ARROW,
  DIALOG_LOG_DATE_OPTIONS,
  DIALOG_LOG_EMPTY_LABEL,
  DIALOG_LOG_ERROR_LABEL,
  DIALOG_LOG_FIELD_SEPARATOR,
  DIALOG_LOG_LOADING_LABEL,
  DIALOG_LOG_TAB,
  DIALOG_LOG_UNKNOWN_USER,
  DIALOG_NO_CHANGE_MESSAGE,
  DIALOG_OPEN_PROJECT_LABEL,
  DIALOG_REMOVE_LABEL,
  DIALOG_SAVE_LABEL,
} from "@/constants/lanceurDialog";
import { EDIT_FIELD_LABELS } from "@/constants/lanceurEdit";
import {
  groupLogEntries,
  phaseLabel,
  type LanceurEmployee,
  type LanceurLogEntry,
  type LanceurRow,
} from "@/lib/lanceur";
import { formatLogValue } from "@/lib/lanceurEdit";
import {
  buildRowPatch,
  rowToSlotForm,
  type SlotForm,
} from "@/lib/lanceurIntake";
import { projectPath } from "@/lib/paths";
import type { LanceurPatch } from "@/schemas/lanceur.schemas";

const logDateFormatter = new Intl.DateTimeFormat(
  LANCEUR_LOCALE,
  DIALOG_LOG_DATE_OPTIONS,
);

type LogState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; entries: LanceurLogEntry[] };

function LogList({ phaseId }: { phaseId: number }) {
  const [state, setState] = useState<LogState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    getLanceurLog(phaseId)
      .then((entries) => {
        if (!cancelled) {
          setState({ status: "ready", entries });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ status: "error" });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [phaseId]);

  if (state.status === "loading") {
    return (
      <p className="text-muted-foreground text-sm">
        {DIALOG_LOG_LOADING_LABEL}
      </p>
    );
  }
  if (state.status === "error") {
    return <p className="text-destructive text-sm">{DIALOG_LOG_ERROR_LABEL}</p>;
  }
  if (state.entries.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">{DIALOG_LOG_EMPTY_LABEL}</p>
    );
  }
  return (
    <ul className="grid gap-2">
      {groupLogEntries(state.entries).map((group) => (
        <li key={group.key} className="rounded-md border p-2 text-sm">
          <p className="text-muted-foreground text-xs font-semibold">
            {logDateFormatter.format(new Date(group.createdAt))}
            {" · "}
            {group.userName ?? DIALOG_LOG_UNKNOWN_USER}
          </p>
          <ul className="mt-1">
            {group.entries.map((entry) => (
              <li key={entry.id}>
                <span className="font-medium">
                  {EDIT_FIELD_LABELS[entry.field]}
                  {DIALOG_LOG_FIELD_SEPARATOR}
                </span>
                <span className="text-muted-foreground">
                  {formatLogValue(entry.field, entry.oldValue)}
                </span>
                {DIALOG_LOG_ARROW}
                <span className="font-semibold">
                  {formatLogValue(entry.field, entry.newValue)}
                </span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

type LanceurProjectDialogProps = {
  row: LanceurRow;
  etapes: string[];
  installateurs: string[];
  employees: LanceurEmployee[];
  onClose: () => void;
  onSave: (patch: LanceurPatch) => void;
  onRemove: () => void;
};

export function LanceurProjectDialog({
  row,
  etapes,
  installateurs,
  employees,
  onClose,
  onSave,
  onRemove,
}: LanceurProjectDialogProps) {
  const [form, setForm] = useState<SlotForm>(() => rowToSlotForm(row));
  const [error, setError] = useState<string | undefined>();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const built = buildRowPatch(row, form);
    if (built.error) {
      setError(built.error);
      return;
    }
    if (Object.keys(built.patch).length === 0) {
      toast(DIALOG_NO_CHANGE_MESSAGE);
      onClose();
      return;
    }
    onSave(built.patch);
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-144 max-h-[90svh] flex-col sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{phaseLabel(row)}</DialogTitle>
          <DialogDescription>{DIALOG_DESCRIPTION}</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="general" className="min-h-0 flex-1">
          <TabsList>
            <TabsTrigger value="general">{DIALOG_GENERAL_TAB}</TabsTrigger>
            <TabsTrigger value="log">{DIALOG_LOG_TAB}</TabsTrigger>
          </TabsList>
          <TabsContent
            value="general"
            className="min-h-0 flex-1 overflow-y-auto pt-3"
          >
            <form onSubmit={submit} className="grid gap-4">
              <LanceurIntakeFields
                form={form}
                error={error}
                etapes={etapes}
                installateurs={installateurs}
                employees={employees}
                className="sm:grid-cols-2"
                onChange={(patch) => {
                  setError(undefined);
                  setForm((current) => ({ ...current, ...patch }));
                }}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button type="submit" size="sm">
                  {DIALOG_SAVE_LABEL}
                </Button>
                <Button
                  render={<Link href={projectPath(row.projectId)} />}
                  nativeButton={false}
                  variant="outline"
                  size="sm"
                >
                  {DIALOG_OPEN_PROJECT_LABEL}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive ml-auto"
                  onClick={() => {
                    onRemove();
                    onClose();
                  }}
                >
                  {DIALOG_REMOVE_LABEL}
                </Button>
              </div>
            </form>
          </TabsContent>
          <TabsContent
            value="log"
            className="min-h-0 flex-1 overflow-y-auto pt-3"
          >
            <LogList phaseId={row.phaseId} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
