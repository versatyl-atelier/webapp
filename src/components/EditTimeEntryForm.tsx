"use client";

import { useActionState, useEffect, useState, type DragEvent } from "react";
import { editTimeEntry } from "@/actions/timeEntries";
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
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import TimeEntryFields, { type DateOption } from "@/components/TimeEntryFields";
import { DEFAULT_SUBTASK_ID } from "@/constants/tasks";
import {
  COPY_COMMAND,
  DUPLICATE_ENTRY_LABEL,
  TIME_ENTRY_DRAG_TYPE,
  TIME_ENTRY_SOURCE_DATE_DRAG_TYPE,
} from "@/constants/timeEntries";

import { useIsCopyModifierPressed } from "@/hooks/use-copy-modifier";
import { projectLinkItem, projectLinkSource } from "@/lib/projectLinks";
import { formatTimeDisplay } from "@/lib/time";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { TimeEntryWithRelations } from "@/schemas/timeEntries.schemas";

export type EditTimeEntryFormProps = {
  entry: TimeEntryWithRelations;
  date: string;
  dateOptions: DateOption[];
  subtasks: { id: string; name: string }[];
  disabled?: string;
};

export default function EditTimeEntryForm({
  entry,
  date,
  dateOptions,
  subtasks,
  disabled,
}: EditTimeEntryFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const canDrag = !disabled && !!entry.end;
  const isCopyModifierPressed = useIsCopyModifierPressed();
  const [state, action, pending] = useActionState(editTimeEntry, undefined);
  useEffect(() => {
    if (state?.message) {
      router.refresh();
      setIsOpen(false);
    }
  }, [state, router]);
  const firstProject = entry.projects[0];
  const defaultProject = firstProject
    ? (projectLinkItem(firstProject) ?? undefined)
    : undefined;
  const projectName = firstProject
    ? projectLinkSource(firstProject)?.name
    : undefined;

  const calculateHours = () => {
    if (!entry.start || !entry.end) return 0;
    return (entry.end.getTime() - entry.start.getTime()) / 3600000;
  };

  function handleOpenChange(opened: boolean) {
    setIsOpen(opened);
  }

  function handleDragStart(event: DragEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    event.dataTransfer.effectAllowed = "copyMove";
    event.dataTransfer.setData(TIME_ENTRY_DRAG_TYPE, String(entry.id));
    event.dataTransfer.setData(TIME_ENTRY_SOURCE_DATE_DRAG_TYPE, date);
    setIsDragging(true);
  }

  return (
    <div
      draggable={canDrag}
      onDragStart={canDrag ? handleDragStart : undefined}
      onDragEnd={() => setIsDragging(false)}
      className={cn(isDragging && "opacity-40")}
    >
      <Dialog
        key={entry.id}
        modal={false}
        open={isOpen}
        onOpenChange={handleOpenChange}
      >
        <DialogTrigger className="block w-full">
          <div
            key={entry.id}
            className={cn(
              "hover:shadow-primary/50 mb-0.5 rounded p-0.5 text-center text-white transition-all hover:scale-110 hover:shadow-lg sm:mb-1 sm:p-1",
              !canDrag && "cursor-pointer",
              canDrag && isCopyModifierPressed && "cursor-copy",
              canDrag &&
                !isCopyModifierPressed &&
                "cursor-grab active:cursor-grabbing",
            )}
            style={{
              backgroundColor: getProjectColor(projectName),
            }}
          >
            <div className="text-xs font-bold wrap-anywhere">{projectName}</div>
            {entry.subtaskId !== DEFAULT_SUBTASK_ID && (
              <div className="text-xs wrap-anywhere opacity-90">
                {entry.subtask.name}
              </div>
            )}
            <div className="text-xs">{formatTimeDisplay(calculateHours())}</div>
          </div>
        </DialogTrigger>
        <DialogContent className="border-2 sm:w-max sm:max-w-[calc(100%-2rem)] sm:min-w-sm">
          <DialogHeader className="border-primary mb-4 border-b-4 pb-2.5 text-center">
            <DialogTitle className="text-lg font-bold">
              {"Modifier l'entrée de temps"}
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
                <input
                  type="hidden"
                  name="startTime"
                  value={entry.start.toString()}
                />
                {state &&
                  state.errors?.timeEntryId?.map((error: string) => (
                    <FieldError key={error}>- {error}</FieldError>
                  ))}
              </Field>

              <TimeEntryFields
                errors={state?.errors}
                dateOptions={dateOptions}
                defaultDate={date}
                defaultHours={formatTimeDisplay(calculateHours())}
                defaultProject={defaultProject}
                subtasks={subtasks}
                defaultSubtaskId={entry.subtaskId}
                disabled={pending || !!disabled}
              />
            </FieldGroup>
            <DialogFooter className="bg-popover mt-5 flex flex-row flex-wrap justify-center gap-2.5 border-t-0 sm:justify-center">
              <Button
                type="submit"
                disabled={pending || !!disabled}
                id="saveTimeEntry"
                name="command"
                value="save"
                className="rounded-sm px-5 py-2.5 text-xs font-bold"
              >
                Sauvegarder
              </Button>
              <Button
                type="submit"
                disabled={pending || !!disabled}
                name="command"
                value={COPY_COMMAND}
                variant="secondary"
                className="rounded-sm px-5 py-2.5 text-xs font-bold"
              >
                {DUPLICATE_ENTRY_LABEL}
              </Button>
              <Button
                type="submit"
                disabled={pending || !!disabled}
                id="deleteTimeEntry"
                name="command"
                value="delete"
                variant="destructive"
                className="rounded-sm px-5 py-2.5 text-xs font-bold"
              >
                Supprimer
              </Button>
              <DialogClose
                render={
                  <Button
                    disabled={pending}
                    variant="outline"
                    className="rounded-sm px-5 py-2.5 text-xs font-bold"
                  />
                }
              >
                Annuler
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
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
