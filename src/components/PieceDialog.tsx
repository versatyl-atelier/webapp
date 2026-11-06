"use client";

import {
  ArrowRight,
  Copy,
  ImageIcon,
  MoreHorizontal,
  StickyNote,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useId, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  deletePiece,
  duplicatePiece,
  restorePiece,
  savePiece,
} from "@/actions/projects";
import { ChipInput } from "@/components/ChipInput";
import { CoverEditor } from "@/components/CoverEditor";
import { FieldErrors } from "@/components/FieldErrors";
import { FileSections } from "@/components/FileSections";
import { FormValidationAlerts } from "@/components/FormValidationAlerts";
import { SuggestInput } from "@/components/SuggestInput";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  SAVED_TOAST_OPTIONS,
  UNNAMED_PIECE_LABEL,
} from "@/constants/projects";
import { COUNT_SEPARATOR, PIECE_FILES_HEADING } from "@/constants/projectFiles";
import { useCoverUpload } from "@/hooks/use-cover-upload";
import { useFileDrop } from "@/hooks/use-file-drop";
import { usePasteUpload } from "@/hooks/use-paste-upload";
import { projectNotesPath } from "@/lib/paths";
import type { FileSectionRecord } from "@/lib/projectFiles";
import type {
  FicheSuggestions,
  PhaseRecord,
  PieceRecord,
} from "@/lib/projects";
import type { PieceFormState } from "@/schemas/projects.schemas";
import { undoToast } from "@/lib/undoToast";

type PieceDialogProps = {
  projectId: string;
  phaseId: number | null;
  phases: PhaseRecord[];
  suggestions: FicheSuggestions;
  piece?: PieceRecord;
  sections: FileSectionRecord[];
  onClose: () => void;
};

export function PieceDialog({
  projectId,
  phaseId,
  phases,
  suggestions,
  piece,
  sections,
  onClose,
}: PieceDialogProps) {
  const formId = useId();
  const { upload, uploading } = useCoverUpload(piece?.id ?? null);
  const { dragOver, dropHandlers } = useFileDrop(
    (dropped) => void upload(dropped),
  );
  usePasteUpload((pasted) => void upload(pasted), { fallback: true });
  const [targetPhaseId, setTargetPhaseId] = useState(phaseId);
  const [busy, startTransition] = useTransition();
  const phaseItems = phases.map(({ id, name }) => ({
    value: String(id),
    label: name,
  }));
  const formRef = useRef<HTMLFormElement>(null);
  const initial = useRef<string | null>(null);
  const [state, setState] = useState<PieceFormState>();
  const [saving, setSaving] = useState(false);
  const snapshot = () =>
    JSON.stringify([
      ...new FormData(formRef.current ?? undefined).entries(),
    ]);
  useEffect(() => {
    initial.current = snapshot();
  }, []);

  // Les changements sont enregistrés à la fermeture de la fenêtre.
  const close = async () => {
    if (saving) return;
    if (!formRef.current || snapshot() === initial.current) {
      onClose();
      return;
    }
    setSaving(true);
    const next = await savePiece(state, new FormData(formRef.current));
    setSaving(false);
    setState(next);
    if (next?.message) {
      toast.success(next.message, SAVED_TOAST_OPTIONS);
      onClose();
    }
  };
  const errors = state?.errors;
  const title = piece ? piece.type || UNNAMED_PIECE_LABEL : NEW_PIECE_LABEL;

  const remove = (target: PieceRecord) =>
    startTransition(async () => {
      await deletePiece(target.id);
      onClose();
      undoToast(
        `${target.type || UNNAMED_PIECE_LABEL} ${PIECE_REMOVED_SUFFIX}`,
        () => startTransition(() => restorePiece(target.id)),
      );
    });

  const duplicate = (target: PieceRecord) =>
    startTransition(async () => {
      await duplicatePiece(target.id);
      onClose();
      toast.success(PIECE_DUPLICATED_MESSAGE, SAVED_TOAST_OPTIONS);
    });

  return (
    <Dialog open onOpenChange={(open) => !open && void close()}>
      <DialogContent
        {...dropHandlers}
        className="max-h-11/12 gap-0 overflow-y-auto p-0 sm:max-w-5xl"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{PIECE_DIALOG_DESCRIPTION}</DialogDescription>
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
                  className="absolute top-3 right-12"
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
        <div className="flex flex-col gap-6 px-6 pt-12 pb-6">
          <form
            id={`${formId}-form`}
            ref={formRef}
            onSubmit={(event) => {
              event.preventDefault();
              void close();
            }}
            className="flex flex-col gap-6"
          >
            <FormValidationAlerts errors={errors} />
            <input type="hidden" name="projectId" value={projectId} />
            {piece && <input type="hidden" name="id" value={piece.id} />}
            <input type="hidden" name="phaseId" value={targetPhaseId ?? ""} />
            <div className="grid items-start gap-6 md:grid-cols-2">
              {piece ? (
                <CoverEditor
                  key={piece.coverUpdatedAt?.toISOString() ?? "none"}
                  projectId={projectId}
                  piece={piece}
                  uploading={uploading}
                  dragOver={dragOver}
                  onUpload={(files) => void upload(files)}
                />
              ) : (
                <div
                  aria-hidden
                  className="bg-muted text-muted-foreground flex aspect-video items-center justify-center rounded-lg border"
                >
                  <ImageIcon className="size-8" />
                </div>
              )}
              <div className="flex min-w-0 flex-col gap-2">
                <Field className="gap-0">
                  <FieldLabel htmlFor={`${formId}-type`} className="sr-only">
                    {PIECE_TYPE_LABEL}
                  </FieldLabel>
                  <SuggestInput
                    id={`${formId}-type`}
                    name="type"
                    suggestions={suggestions.type}
                    defaultValue={piece?.type}
                    placeholder={PIECE_TYPE_PLACEHOLDER}
                    invalid={!!errors?.type}
                    className="hover:border-input h-auto border-transparent bg-transparent px-2 py-1 text-xl font-semibold tracking-tight shadow-none md:text-xl dark:bg-transparent"
                  />
                  <FieldErrors errors={errors?.type} />
                </Field>
                <Field className="gap-0">
                  <FieldLabel
                    htmlFor={`${formId}-description`}
                    className="sr-only"
                  >
                    {PIECE_DESCRIPTION_LABEL}
                  </FieldLabel>
                  <Textarea
                    id={`${formId}-description`}
                    name="description"
                    defaultValue={piece?.description}
                    placeholder={PIECE_DESCRIPTION_PLACEHOLDER}
                    rows={2}
                    aria-invalid={!!errors?.description}
                    className="text-muted-foreground hover:border-input min-h-0 border-transparent bg-transparent px-2 py-1 text-sm shadow-none md:text-sm dark:bg-transparent"
                  />
                  <FieldErrors errors={errors?.description} />
                </Field>
                {piece && (
                  <Link
                    href={projectNotesPath(projectId)}
                    className="bg-primary/10 text-primary focus-visible:ring-ring/50 mt-1 inline-flex w-fit items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium outline-hidden hover:brightness-110 focus-visible:ring-3"
                  >
                    <StickyNote aria-hidden className="size-3.5" />
                    {PIECE_NOTES_LABEL}
                    {piece.noteCount > 0 &&
                      `${COUNT_SEPARATOR}${piece.noteCount}`}
                    <ArrowRight aria-hidden className="size-3.5" />
                  </Link>
                )}
              </div>
            </div>
            <div className="grid gap-x-4 gap-y-3.5 border-t pt-5 sm:grid-cols-3">
              <Field className="gap-1.5 sm:col-span-2">
                <FieldLabel
                  htmlFor={`${formId}-cladding`}
                  className="text-muted-foreground text-xs"
                >
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
                  <FieldLabel
                    htmlFor={`${formId}-${key}`}
                    className="text-muted-foreground text-xs"
                  >
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
              <Field className="gap-1.5">
                <FieldLabel
                  htmlFor={`${formId}-cabinetCount`}
                  className="text-muted-foreground text-xs"
                >
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
                  <FieldLabel
                    htmlFor={`${formId}-phase`}
                    className="text-muted-foreground text-xs"
                  >
                    {PIECE_PHASE_LABEL}
                  </FieldLabel>
                  <Select
                    items={phaseItems}
                    value={
                      targetPhaseId === null ? null : String(targetPhaseId)
                    }
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
          </form>
          {piece?.dropboxLinked && (
            <section
              aria-labelledby={`${formId}-files`}
              className="flex flex-col gap-3 border-t pt-5"
            >
              <h3 id={`${formId}-files`} className="sr-only">
                {PIECE_FILES_HEADING}
              </h3>
              <FileSections
                projectId={projectId}
                pieceId={piece.id}
                sections={sections}
                variant="box"
              />
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
