"use client";

import { Copy, MoreHorizontal, StickyNote, Trash2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useId, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  deletePiece,
  duplicatePiece,
  restorePiece,
  savePiece,
} from "@/actions/projects";
import { ChipInput } from "@/components/ChipInput";
import { FieldErrors } from "@/components/FieldErrors";
import { FormValidationAlerts } from "@/components/FormValidationAlerts";
import { SuggestInput } from "@/components/SuggestInput";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CABINET_COUNT_LABEL,
  CANCEL_LABEL,
  CLADDING_FORM_FIELD,
  CLADDING_PLACEHOLDER,
  DUPLICATE_PIECE_LABEL,
  NEW_PIECE_LABEL,
  PIECE_CLADDING_LABEL,
  PIECE_DESCRIPTION_LABEL,
  PIECE_DESCRIPTION_PLACEHOLDER,
  PIECE_DIALOG_DESCRIPTION,
  PIECE_DUPLICATED_MESSAGE,
  PIECE_NOTES_LABEL,
  PIECE_OPTIONS_LABEL,
  PIECE_PHASE_LABEL,
  PIECE_REMOVED_SUFFIX,
  PIECE_TEXT_FIELDS,
  PIECE_TYPE_LABEL,
  PIECE_TYPE_PLACEHOLDER,
  REMOVE_PIECE_LABEL,
  SAVE_LABEL,
  SAVED_TOAST_OPTIONS,
  TOAST_UNDO_DURATION_MS,
  UNDO_LABEL,
  UNNAMED_PIECE_LABEL,
} from "@/constants/projects";
import { projectNotesPath } from "@/lib/paths";
import type {
  FicheSuggestions,
  PhaseRecord,
  PieceRecord,
} from "@/lib/projects";
import type { PieceFormState } from "@/schemas/projects.schemas";

type PieceDialogProps = {
  projectId: string;
  phaseId: number | null;
  phases: PhaseRecord[];
  suggestions: FicheSuggestions;
  piece?: PieceRecord;
  onClose: () => void;
};

export function PieceDialog({
  projectId,
  phaseId,
  phases,
  suggestions,
  piece,
  onClose,
}: PieceDialogProps) {
  const formId = useId();
  const [targetPhaseId, setTargetPhaseId] = useState(phaseId);
  const [busy, startTransition] = useTransition();
  const phaseItems = phases.map(({ id, name }) => ({
    value: String(id),
    label: name,
  }));
  const [state, action, saving] = useActionState(
    async (formState: PieceFormState, formData: FormData) => {
      const next = await savePiece(formState, formData);
      if (next?.message) {
        toast.success(next.message, SAVED_TOAST_OPTIONS);
        onClose();
      }
      return next;
    },
    undefined,
  );
  const errors = state?.errors;
  const title = piece ? piece.type || UNNAMED_PIECE_LABEL : NEW_PIECE_LABEL;

  const remove = (target: PieceRecord) =>
    startTransition(async () => {
      await deletePiece(target.id);
      onClose();
      toast(`${target.type || UNNAMED_PIECE_LABEL} ${PIECE_REMOVED_SUFFIX}`, {
        duration: TOAST_UNDO_DURATION_MS,
        action: {
          label: UNDO_LABEL,
          onClick: () => startTransition(() => restorePiece(target.id)),
        },
      });
    });

  const duplicate = (target: PieceRecord) =>
    startTransition(async () => {
      await duplicatePiece(target.id);
      onClose();
      toast.success(PIECE_DUPLICATED_MESSAGE, SAVED_TOAST_OPTIONS);
    });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader className="pr-20">
          <DialogTitle className="text-lg">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            {PIECE_DIALOG_DESCRIPTION}
          </DialogDescription>
        </DialogHeader>
        {piece && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={PIECE_OPTIONS_LABEL}
                  disabled={busy}
                  className="absolute top-2 right-11"
                />
              }
            >
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => duplicate(piece)}>
                <Copy />
                {DUPLICATE_PIECE_LABEL}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => remove(piece)}
              >
                <Trash2 />
                {REMOVE_PIECE_LABEL}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <form action={action} className="flex flex-col gap-4">
          <FormValidationAlerts errors={errors} />
          <input type="hidden" name="projectId" value={projectId} />
          {piece && <input type="hidden" name="id" value={piece.id} />}
          <input type="hidden" name="phaseId" value={targetPhaseId ?? ""} />
          <Field className="gap-1.5">
            <FieldLabel htmlFor={`${formId}-type`}>
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
          <Field className="gap-1.5">
            <FieldLabel htmlFor={`${formId}-description`}>
              {PIECE_DESCRIPTION_LABEL}
            </FieldLabel>
            <Textarea
              id={`${formId}-description`}
              name="description"
              defaultValue={piece?.description}
              placeholder={PIECE_DESCRIPTION_PLACEHOLDER}
              rows={2}
              aria-invalid={!!errors?.description}
            />
            <FieldErrors errors={errors?.description} />
          </Field>
          <div className="grid gap-x-4 gap-y-3 sm:grid-cols-3">
            <Field className="gap-1.5 sm:col-span-2">
              <FieldLabel htmlFor={`${formId}-cladding`}>
                {PIECE_CLADDING_LABEL}
              </FieldLabel>
              <ChipInput
                id={`${formId}-cladding`}
                name={CLADDING_FORM_FIELD}
                suggestions={suggestions.cladding}
                defaultValue={piece?.cladding}
                placeholder={CLADDING_PLACEHOLDER}
              />
              <FieldErrors errors={errors?.cladding} />
            </Field>
            {PIECE_TEXT_FIELDS.map(({ key, label }) => (
              <Field key={key} className="gap-1.5">
                <FieldLabel htmlFor={`${formId}-${key}`}>{label}</FieldLabel>
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
            <Field className="gap-1.5">
              <FieldLabel htmlFor={`${formId}-cabinetCount`}>
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
              <Field className="gap-1.5">
                <FieldLabel htmlFor={`${formId}-phase`}>
                  {PIECE_PHASE_LABEL}
                </FieldLabel>
                <Select
                  items={phaseItems}
                  value={targetPhaseId === null ? null : String(targetPhaseId)}
                  onValueChange={(value) => {
                    if (value !== null) {
                      setTargetPhaseId(Number(value));
                    }
                  }}
                >
                  <SelectTrigger id={`${formId}-phase`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {phaseItems.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldErrors errors={errors?.phaseId} />
              </Field>
            )}
          </div>
          <DialogFooter className="sm:justify-between">
            {piece ? (
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href={projectNotesPath(projectId)} />}
              >
                <StickyNote />
                {PIECE_NOTES_LABEL}
                {piece.noteCount > 0 && ` · ${piece.noteCount}`}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="ghost" onClick={onClose}>
                {CANCEL_LABEL}
              </Button>
              <Button type="submit" disabled={saving || busy}>
                {SAVE_LABEL}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
