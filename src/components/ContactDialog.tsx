"use client";

import { MoreHorizontal, Trash2 } from "lucide-react";
import { useActionState, useId, useTransition } from "react";
import { toast } from "sonner";

import { deleteContact, restoreContact, saveContact } from "@/actions/projects";
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
  CANCEL_LABEL,
  CONTACT_DIALOG_DESCRIPTION,
  CONTACT_FIELDS,
  CONTACT_OPTIONS_LABEL,
  CONTACT_REMOVED_SUFFIX,
  NEW_CONTACT_LABEL,
  REMOVE_CONTACT_LABEL,
  SAVE_LABEL,
  SAVED_TOAST_OPTIONS,
} from "@/constants/projects";
import {
  contactHeadline,
  type ContactRecord,
  type FicheSuggestions,
} from "@/lib/projects";
import type { ContactFormState } from "@/schemas/projects.schemas";
import { undoToast } from "@/lib/undoToast";

type ContactField = (typeof CONTACT_FIELDS)[number]["key"];

const INPUT_TYPES: Partial<Record<ContactField, string>> = {
  phone: "tel",
  email: "email",
};

const FULL_WIDTH_FIELDS: readonly ContactField[] = ["company", "address"];

type ContactDialogProps = {
  projectId: string;
  suggestions: Pick<FicheSuggestions, "role" | "company">;
  contact?: ContactRecord;
  onClose: () => void;
};

export function ContactDialog({
  projectId,
  suggestions,
  contact,
  onClose,
}: ContactDialogProps) {
  const formId = useId();
  const [busy, startTransition] = useTransition();
  const [state, action, saving] = useActionState(
    async (formState: ContactFormState, formData: FormData) => {
      const next = await saveContact(formState, formData);
      if (next?.message) {
        toast.success(next.message, SAVED_TOAST_OPTIONS);
        onClose();
      }
      return next;
    },
    undefined,
  );
  const errors = state?.errors;
  const title = contact ? contactHeadline(contact) : NEW_CONTACT_LABEL;

  const remove = (target: ContactRecord) =>
    startTransition(async () => {
      await deleteContact(target.id);
      onClose();
      undoToast(`${contactHeadline(target)} ${CONTACT_REMOVED_SUFFIX}`, () =>
        startTransition(() => restoreContact(target.id)),
      );
    });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-11/12 overflow-y-auto sm:max-w-lg">
        <DialogHeader className="pr-20">
          <DialogTitle className="text-lg">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            {CONTACT_DIALOG_DESCRIPTION}
          </DialogDescription>
        </DialogHeader>
        {contact && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={CONTACT_OPTIONS_LABEL}
                  disabled={busy}
                  className="absolute top-2 right-11"
                />
              }
            >
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                onClick={() => remove(contact)}
              >
                <Trash2 />
                {REMOVE_CONTACT_LABEL}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <form action={action} className="flex flex-col gap-4">
          <FormValidationAlerts errors={errors} />
          <input type="hidden" name="projectId" value={projectId} />
          {contact && <input type="hidden" name="id" value={contact.id} />}
          <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
            {CONTACT_FIELDS.map(({ key, label, placeholder }) => {
              const id = `${formId}-${key}`;
              const fieldErrors = errors?.[key];
              return (
                <Field
                  key={key}
                  className={
                    FULL_WIDTH_FIELDS.includes(key)
                      ? "gap-1.5 sm:col-span-2"
                      : "gap-1.5"
                  }
                >
                  <FieldLabel htmlFor={id}>{label}</FieldLabel>
                  {key === "role" || key === "company" ? (
                    <SuggestInput
                      id={id}
                      name={key}
                      suggestions={suggestions[key]}
                      defaultValue={contact?.[key]}
                      placeholder={placeholder}
                      invalid={!!fieldErrors}
                    />
                  ) : (
                    <Input
                      id={id}
                      name={key}
                      type={INPUT_TYPES[key]}
                      defaultValue={contact?.[key]}
                      placeholder={placeholder}
                      aria-invalid={!!fieldErrors}
                    />
                  )}
                  <FieldErrors errors={fieldErrors} />
                </Field>
              );
            })}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              {CANCEL_LABEL}
            </Button>
            <Button type="submit" disabled={saving || busy}>
              {SAVE_LABEL}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
