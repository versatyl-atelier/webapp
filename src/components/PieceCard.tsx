"use client";

import { GripVertical, X } from "lucide-react";
import { useActionState, useId, useState, useTransition } from "react";
import { toast } from "sonner";

import { deletePiece, savePiece } from "@/actions/projects";
import { FieldErrors } from "@/components/FieldErrors";
import { FormValidationAlerts } from "@/components/FormValidationAlerts";
import { SuggestInput } from "@/components/SuggestInput";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CABINET_COUNT_LABEL,
  CANCEL_LABEL,
  DRAG_PIECE_LABEL,
  EDIT_LABEL,
  NO_PIECE_DETAILS_LABEL,
  PIECE_DRAG_TYPE,
  PIECE_PHASE_LABEL,
  PIECE_TEXT_FIELDS,
  PIECE_TYPE_LABEL,
  PIECE_TYPE_PLACEHOLDER,
  REMOVE_PIECE_LABEL,
  SAVE_LABEL,
  SAVED_TOAST_OPTIONS,
  UNNAMED_PIECE_LABEL,
} from "@/constants/projects";
import {
  pieceReadFields,
  type FicheSuggestions,
  type PhaseRecord,
  type PieceRecord,
} from "@/lib/projects";
import { cn } from "@/lib/utils";
import type { PieceFormState } from "@/schemas/projects.schemas";

type PieceCardProps = {
  projectId: string;
  phaseId: number | null;
  phases: PhaseRecord[];
  suggestions: FicheSuggestions;
  piece?: PieceRecord;
  draggable?: boolean;
  onClose?: () => void;
};

export function PieceCard({
  projectId,
  phaseId,
  phases,
  suggestions,
  piece,
  draggable = false,
  onClose,
}: PieceCardProps) {
  const formId = useId();
  const [editing, setEditing] = useState(!piece);
  const [dragging, setDragging] = useState(false);
  const [targetPhaseId, setTargetPhaseId] = useState(phaseId);
  const [deleting, startDeleting] = useTransition();
  const [state, action, saving] = useActionState(
    async (formState: PieceFormState, formData: FormData) => {
      const next = await savePiece(formState, formData);
      if (next?.message) {
        toast.success(next.message, SAVED_TOAST_OPTIONS);
        setEditing(false);
        onClose?.();
      }
      return next;
    },
    undefined,
  );
  const errors = state?.errors;
  const title = piece?.type || UNNAMED_PIECE_LABEL;

  const cancel = () => {
    setTargetPhaseId(phaseId);
    setEditing(false);
    onClose?.();
  };

  const removeButton = piece ? (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={REMOVE_PIECE_LABEL}
          disabled={deleting}
        >
          <X />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {REMOVE_PIECE_LABEL} « {title} » ?
          </AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{CANCEL_LABEL}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => startDeleting(() => deletePiece(piece.id))}
          >
            {REMOVE_PIECE_LABEL}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : null;

  if (!editing && piece) {
    const fields = pieceReadFields(piece);
    return (
      <li
        draggable={draggable}
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData(PIECE_DRAG_TYPE, String(piece.id));
          setDragging(true);
        }}
        onDragEnd={() => setDragging(false)}
        className={cn(
          "bg-card rounded-lg border px-3 py-2.5",
          dragging && "opacity-40",
          deleting && "opacity-60",
        )}
      >
        <div className="mb-2 flex items-center gap-2.5">
          {draggable && (
            <span title={DRAG_PIECE_LABEL} className="cursor-grab">
              <GripVertical
                aria-hidden
                className="text-muted-foreground size-4 shrink-0"
              />
            </span>
          )}
          <h3 className="min-w-0 flex-1 font-semibold">{title}</h3>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            {EDIT_LABEL}
          </Button>
          {removeButton}
        </div>
        {fields.length === 0 ? (
          <p className="text-muted-foreground text-sm italic">
            {NO_PIECE_DETAILS_LABEL}
          </p>
        ) : (
          <dl className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {fields.map(({ label, value }) => (
              <div key={label} className="flex gap-1">
                <dt className="text-foreground font-semibold">{label} :</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </li>
    );
  }

  return (
    <li className="bg-card rounded-lg border px-3 py-2.5">
      <form action={action} className="flex flex-col gap-3">
        <FormValidationAlerts errors={errors} />
        <input type="hidden" name="projectId" value={projectId} />
        {piece && <input type="hidden" name="id" value={piece.id} />}
        <input type="hidden" name="phaseId" value={targetPhaseId ?? ""} />
        <div className="flex items-end gap-2.5">
          <Field className="min-w-0 flex-1 gap-1">
            <FieldLabel htmlFor={`${formId}-type`} className="text-xs">
              {PIECE_TYPE_LABEL}
            </FieldLabel>
            <SuggestInput
              id={`${formId}-type`}
              name="type"
              suggestions={suggestions.type}
              defaultValue={piece?.type}
              placeholder={PIECE_TYPE_PLACEHOLDER}
              invalid={!!errors?.type}
              className="font-semibold"
            />
            <FieldErrors errors={errors?.type} />
          </Field>
          {removeButton}
        </div>
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-2 md:grid-cols-3">
          {PIECE_TEXT_FIELDS.map(({ key, label }) => (
            <Field key={key} className="gap-1">
              <FieldLabel htmlFor={`${formId}-${key}`} className="text-xs">
                {label}
              </FieldLabel>
              <SuggestInput
                id={`${formId}-${key}`}
                name={key}
                suggestions={suggestions[key]}
                defaultValue={piece?.[key]}
                invalid={!!errors?.[key]}
              />
              <FieldErrors errors={errors?.[key]} />
            </Field>
          ))}
          <Field className="gap-1">
            <FieldLabel htmlFor={`${formId}-cabinetCount`} className="text-xs">
              {CABINET_COUNT_LABEL}
            </FieldLabel>
            <Input
              id={`${formId}-cabinetCount`}
              name="cabinetCount"
              type="number"
              min={0}
              defaultValue={piece?.cabinetCount ?? ""}
              aria-invalid={!!errors?.cabinetCount}
            />
            <FieldErrors errors={errors?.cabinetCount} />
          </Field>
          {phases.length > 0 && (
            <Field className="gap-1">
              <FieldLabel htmlFor={`${formId}-phase`} className="text-xs">
                {PIECE_PHASE_LABEL}
              </FieldLabel>
              <Select
                value={
                  targetPhaseId === null ? undefined : String(targetPhaseId)
                }
                onValueChange={(value) => setTargetPhaseId(Number(value))}
              >
                <SelectTrigger id={`${formId}-phase`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {phases.map(({ id, name }) => (
                    <SelectItem key={id} value={String(id)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldErrors errors={errors?.phaseId} />
            </Field>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={cancel}>
            {CANCEL_LABEL}
          </Button>
          <Button type="submit" disabled={saving}>
            {SAVE_LABEL}
          </Button>
        </div>
      </form>
    </li>
  );
}
