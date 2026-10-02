"use client";

import { useActionState, useId, useState, type KeyboardEvent } from "react";

import { addNote } from "@/actions/projects";
import { FieldErrors } from "@/components/FieldErrors";
import { FormValidationAlerts } from "@/components/FormValidationAlerts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ADD_NOTE_LABEL,
  NEW_NOTE_LABEL,
  NEW_NOTE_PLACEHOLDER,
  SUBMIT_NOTE_HINT,
  SUBMIT_NOTE_KEY,
  SUBMIT_NOTE_KEYS_APPLE,
  SUBMIT_NOTE_KEYS_DEFAULT,
} from "@/constants/projects";
import { useIsApplePlatform } from "@/hooks/use-apple-platform";
import type { NoteFormState } from "@/schemas/projects.schemas";

export function submitFormOnShortcut(
  event: KeyboardEvent<HTMLTextAreaElement>,
) {
  if (event.key === SUBMIT_NOTE_KEY && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }
}

type NoteComposerProps = {
  projectId: string;
  phaseId: number | null;
  sectionTitle: string;
};

export function NoteComposer({
  projectId,
  phaseId,
  sectionTitle,
}: NoteComposerProps) {
  const hintId = useId();
  const [body, setBody] = useState("");
  const keys = useIsApplePlatform()
    ? SUBMIT_NOTE_KEYS_APPLE
    : SUBMIT_NOTE_KEYS_DEFAULT;
  const [state, action, saving] = useActionState(
    async (formState: NoteFormState, formData: FormData) => {
      const submitted = formData.get("body");
      const next = await addNote(formState, formData);
      if (next?.message) {
        setBody((current) => (current === submitted ? "" : current));
      }
      return next;
    },
    undefined,
  );
  const errors = state?.errors;

  return (
    <form action={action} className="mx-1.5 mt-1.5 mb-1 flex flex-col gap-1.5">
      <FormValidationAlerts errors={errors} />
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="phaseId" value={phaseId ?? ""} />
      <Textarea
        name="body"
        required
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={submitFormOnShortcut}
        placeholder={`${NEW_NOTE_PLACEHOLDER} « ${sectionTitle} »…`}
        aria-label={`${NEW_NOTE_LABEL} : ${sectionTitle}`}
        aria-describedby={hintId}
        aria-invalid={!!errors?.body}
        className="bg-card min-h-11"
      />
      <FieldErrors errors={errors?.body} />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={saving || !body.trim()}>
          {ADD_NOTE_LABEL}
        </Button>
        <p id={hintId} className="text-muted-foreground text-xs">
          {keys.map((key, index) => (
            <span key={key}>
              {index > 0 && "+"}
              <kbd className="bg-muted text-2xs rounded-sm border px-1 font-sans">
                {key}
              </kbd>
            </span>
          ))}{" "}
          {SUBMIT_NOTE_HINT}
        </p>
      </div>
    </form>
  );
}
