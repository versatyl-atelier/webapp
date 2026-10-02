"use client";

import { ChevronRight, Link, Pencil, RotateCcw, Trash2 } from "lucide-react";
import {
  useActionState,
  useId,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import { deleteNote, editNote, restoreNote } from "@/actions/projects";
import { FieldErrors } from "@/components/FieldErrors";
import { FormValidationAlerts } from "@/components/FormValidationAlerts";
import { submitFormOnShortcut } from "@/components/NoteComposer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CANCEL_LABEL,
  CURRENT_USER_LABEL,
  DELETE_NOTE_CONFIRMATION,
  DELETE_NOTE_LABEL,
  DELETED_NOTE_LABEL,
  EDIT_NOTE_LABEL,
  EDITED_NOTE_LABEL,
  HIDE_NOTE_HISTORY_LABEL,
  LINK_EMAIL_LABEL,
  PROJECT_STAGE_LABEL,
  PROJECT_STAGE_LABELS,
  RESTORE_NOTE_LABEL,
  SAVE_NOTE_EDIT_LABEL,
  SHOW_NOTE_HISTORY_LABEL,
  UNKNOWN_AUTHOR_LABEL,
} from "@/constants/projects";
import {
  authorColorClass,
  authorInitials,
  currentVersion,
  formatNoteFullTime,
  formatNoteTime,
  previousVersions,
  type NoteAuthor,
  type NoteRecord,
  type NoteVersionRecord,
} from "@/lib/projectNotes";
import { cn } from "@/lib/utils";
import type { NoteEditFormState } from "@/schemas/projects.schemas";

type AuthorTagProps = {
  author: NoteAuthor | null;
  currentUser: NoteAuthor;
};

function AuthorTag({ author, currentUser }: AuthorTagProps) {
  const label =
    author?.id === currentUser.id
      ? CURRENT_USER_LABEL
      : (author?.name ?? UNKNOWN_AUTHOR_LABEL);
  return (
    <span
      title={label}
      className={cn(
        "text-2xs mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full font-bold text-white select-none",
        authorColorClass(author),
      )}
    >
      <span aria-hidden>{authorInitials(author)}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

type NoteRowProps = {
  version: NoteVersionRecord;
  currentUser: NoteAuthor;
  now: Date;
  struck?: boolean;
  toggle?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
};

function NoteRow({
  version,
  currentUser,
  now,
  struck = false,
  toggle,
  status,
  actions,
}: NoteRowProps) {
  return (
    <div className="group/row hover:bg-muted flex flex-wrap items-start gap-2 rounded-md px-1.5 py-1 sm:flex-nowrap">
      <AuthorTag author={version.author} currentUser={currentUser} />
      <span className="flex size-5 shrink-0 items-center justify-center">
        {toggle}
      </span>
      <p
        className={cn(
          "min-w-0 flex-1 pt-px text-sm break-words whitespace-pre-wrap",
          struck && "text-muted-foreground line-through",
        )}
      >
        {version.body}
      </p>
      <div className="sm:w-note-meta flex shrink-0 items-center gap-2 max-sm:basis-full max-sm:pl-14 sm:pl-2.5">
        <div className="text-muted-foreground flex min-w-0 flex-1 flex-col items-start gap-0.5 text-xs">
          <time
            dateTime={version.createdAt.toISOString()}
            title={formatNoteFullTime(version.createdAt)}
            className="whitespace-nowrap"
          >
            {formatNoteTime(version.createdAt, now)}
          </time>
          {status}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center transition-opacity pointer-fine:opacity-0 pointer-fine:group-focus-within/row:opacity-100 pointer-fine:group-hover/row:opacity-100">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

type NoteEditFormProps = {
  note: NoteRecord;
  currentUser: NoteAuthor;
  onClose: (saved: boolean) => void;
};

function NoteEditForm({ note, currentUser, onClose }: NoteEditFormProps) {
  const [state, action, saving] = useActionState(
    async (formState: NoteEditFormState, formData: FormData) => {
      const next = await editNote(formState, formData);
      if (next?.message) {
        onClose(true);
      }
      return next;
    },
    undefined,
  );
  const errors = state?.errors;

  return (
    <form
      action={action}
      className="flex flex-wrap items-start gap-2 px-1.5 py-1 sm:flex-nowrap"
    >
      <AuthorTag author={currentUser} currentUser={currentUser} />
      <span className="size-5 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <FormValidationAlerts errors={errors} />
        <input type="hidden" name="id" value={note.id} />
        <Textarea
          name="body"
          required
          autoFocus
          defaultValue={currentVersion(note).body}
          onKeyDown={submitFormOnShortcut}
          aria-label={EDITED_NOTE_LABEL}
          aria-invalid={!!errors?.body}
          className="bg-card min-h-14"
        />
        <FieldErrors errors={errors?.body} />
        <div className="flex gap-1.5">
          <Button type="submit" size="sm" disabled={saving}>
            {SAVE_NOTE_EDIT_LABEL}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onClose(false)}
          >
            {CANCEL_LABEL}
          </Button>
        </div>
      </div>
      <span className="w-note-meta shrink-0 max-sm:hidden" />
    </form>
  );
}

type NoteThreadProps = {
  note: NoteRecord;
  currentUser: NoteAuthor;
  now: Date;
};

export function NoteThread({ note, currentUser, now }: NoteThreadProps) {
  const historyId = useId();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const current = currentVersion(note);
  const history = previousVersions(note);

  if (editing) {
    return (
      <li>
        <NoteEditForm
          note={note}
          currentUser={currentUser}
          onClose={(saved) => {
            setEditing(false);
            if (saved) {
              setHistoryOpen(true);
            }
          }}
        />
      </li>
    );
  }

  const toggle =
    history.length > 0 ? (
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-expanded={historyOpen}
        aria-controls={historyId}
        aria-label={
          historyOpen ? HIDE_NOTE_HISTORY_LABEL : SHOW_NOTE_HISTORY_LABEL
        }
        onClick={() => setHistoryOpen((open) => !open)}
        className="text-muted-foreground size-5"
      >
        <ChevronRight
          className={cn("transition-transform", historyOpen && "rotate-90")}
        />
      </Button>
    ) : null;

  const status = note.isDeleted ? (
    <Badge variant="secondary">{DELETED_NOTE_LABEL}</Badge>
  ) : (
    current.stage && (
      <Badge variant="secondary">
        <span className="sr-only">{PROJECT_STAGE_LABEL} : </span>
        {PROJECT_STAGE_LABELS[current.stage]}
      </Badge>
    )
  );

  const actions = note.isDeleted ? (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={RESTORE_NOTE_LABEL}
      title={RESTORE_NOTE_LABEL}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await restoreNote(note.id);
          setHistoryOpen(false);
        })
      }
    >
      <RotateCcw />
    </Button>
  ) : (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} className="rounded-md">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={LINK_EMAIL_LABEL}
              disabled
            >
              <Link />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>{LINK_EMAIL_LABEL}</TooltipContent>
      </Tooltip>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={EDIT_NOTE_LABEL}
        title={EDIT_NOTE_LABEL}
        disabled={pending}
        onClick={() => setEditing(true)}
      >
        <Pencil />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={DELETE_NOTE_LABEL}
        title={DELETE_NOTE_LABEL}
        disabled={pending}
        onClick={() => setConfirmingDelete(true)}
      >
        <Trash2 />
      </Button>
    </>
  );

  return (
    <li className={cn("flex flex-col", pending && "opacity-60")}>
      <NoteRow
        version={current}
        currentUser={currentUser}
        now={now}
        struck={note.isDeleted}
        toggle={toggle}
        status={status}
        actions={actions}
      />
      {confirmingDelete && !note.isDeleted && (
        <div className="text-muted-foreground mt-0.5 mb-1 ml-14 flex flex-wrap items-center gap-2 text-xs">
          <span>{DELETE_NOTE_CONFIRMATION}</span>
          <Button
            type="button"
            variant="destructive"
            size="xs"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await deleteNote(note.id);
                setConfirmingDelete(false);
              })
            }
          >
            {DELETE_NOTE_LABEL}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            autoFocus
            onClick={() => setConfirmingDelete(false)}
          >
            {CANCEL_LABEL}
          </Button>
        </div>
      )}
      {history.length > 0 && (
        <ul id={historyId} hidden={!historyOpen}>
          {history.map((version) => (
            <li key={version.id}>
              <NoteRow
                version={version}
                currentUser={currentUser}
                now={now}
                struck
              />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
