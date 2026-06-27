"use client";

import { useActionState, useEffect, useState } from "react";
import { editTimeEntry } from "@/app/actions/timeEntries";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import ProjectSelect from "@/components/ProjectSelect";

import { formatTimeDisplay } from "@/lib/parseTimeToSeconds";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";
import type { TimeEntryWithRelations } from "@/app/actions/timeEntries";

export type EditTimeEntryFormProps = {
  entry: TimeEntryWithRelations;
};

export default function EditTimeEntryForm({ entry }: EditTimeEntryFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [state, action, pending] = useActionState(editTimeEntry, undefined);
  useEffect(() => {
    if (state?.message === "Supprimé" || state?.message === "Sauvegardé") {
      router.refresh();
      setIsOpen(false);
    }
  }, [state]);
  const projectName =
    entry.projectType === "TRELLO" ? entry.project?.name : entry.task?.name;

  function handleOpenChange(opened: boolean) {
    setIsOpen(opened);
  }
  return (
    <Dialog
      key={entry.id}
      modal={false}
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger>
        <div
          key={entry.id}
          className="hover:shadow-punch-accent-hover/50 mb-0.5 cursor-pointer rounded p-0.5 text-center text-white transition-all hover:scale-110 hover:shadow-lg sm:mb-1 sm:p-1"
          style={{
            backgroundColor: getProjectColor(projectName),
          }}
          title={`${projectName} - ${formatTimeDisplay(entry.hours || 0)}`}
        >
          <div className="truncate text-xs font-bold">{projectName}</div>
          {entry.subtaskId && entry.subtaskId !== "1default" && (
            <div className="truncate text-xs opacity-90">{entry.subtaskId}</div>
          )}
          <div className="text-xs">{formatTimeDisplay(entry.hours || 0)}</div>
        </div>
      </DialogTrigger>
      <DialogContent className="border-2 border-black">
        <DialogHeader className="border-punch-accent mb-4 border-b-4 pb-2.5 text-center">
          <DialogTitle className="text-lg font-bold text-black" asChild>
            <h2>{"Modifier l'entrée de temps"}</h2>
          </DialogTitle>
        </DialogHeader>
        <form action={action}>
          <FieldGroup>
            <Field>
              <input
                type="hidden"
                id="timeEntryId"
                name="timeEntryId"
                value={entry.id}
              />
              {state?.errors?.timeEntryId?.map((error: string) => (
                <FieldError key={error}>- {error}</FieldError>
              ))}
            </Field>

            <ProjectSelect
              defaultSelectedProjectOrTask={{
                id:
                  entry.projectType === "TRELLO"
                    ? entry.projectId || ""
                    : entry.taskId || -1,
                type: entry.projectType === "TRELLO" ? "trello" : "task",
              }}
            />
            {state?.errors?.projectId?.map((error: string) => (
              <FieldError key={error}>- {error}</FieldError>
            ))}
            <Field>
              <FieldLabel
                htmlFor="hours"
                className="mb-1 block text-xs font-semibold text-black uppercase"
              >
                Heures
              </FieldLabel>
              <Input
                id="hours"
                name="hours"
                type="text"
                defaultValue={formatTimeDisplay(entry.hours || 0)}
                className="w-full rounded border-2 border-black px-1.5 py-1 text-xs text-black"
                placeholder="Ex: 8.75 ou 8h45"
              />
              {state?.errors?.hours?.map((error: string) => (
                <FieldError key={error}>- {error}</FieldError>
              ))}
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-5 flex justify-center gap-2.5 border-t-0 bg-white">
            <Button
              type="submit"
              disabled={pending}
              id="saveTimeEntry"
              name="command"
              value="save"
              variant="ghost"
              className="bg-punch-accent hover:bg-punch-accent-hover rounded-sm px-5 py-2.5 text-xs font-bold text-white hover:text-white"
            >
              Sauvegarder
            </Button>
            <Button
              type="submit"
              disabled={pending}
              id="deleteTimeEntry"
              name="command"
              value="delete"
              variant="ghost"
              className="hover:bg-punch-accent rounded-sm bg-black px-5 py-2.5 text-xs font-bold text-white hover:text-white"
            >
              Supprimer
            </Button>
            <DialogClose asChild>
              <Button
                disabled={pending}
                variant="ghost"
                className="bg-punch-light rounded-sm px-5 py-2.5 text-xs font-bold text-black hover:bg-black hover:text-white"
              >
                Annuler
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function getProjectColor(projectName?: string): string {
  const hash = hashString(projectName || "");
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 45%)`;
}
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}
