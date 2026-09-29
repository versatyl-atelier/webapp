"use client";

import { Plus, X } from "lucide-react";
import { useActionState, useId, useState } from "react";
import { toast } from "sonner";

import { saveProjectContacts } from "@/actions/projects";
import { FieldErrors } from "@/components/FieldErrors";
import { FormValidationAlerts } from "@/components/FormValidationAlerts";
import { SuggestInput } from "@/components/SuggestInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  ADD_CONTACT_LABEL,
  CANCEL_LABEL,
  CONTACT_FIELDS,
  CONTACTS_HEADING,
  EDIT_LABEL,
  NO_CONTACTS_LABEL,
  REMOVE_CONTACT_LABEL,
  SAVE_LABEL,
  SAVED_TOAST_OPTIONS,
} from "@/constants/projects";
import {
  contactDetails,
  contactHeadline,
  EMPTY_CONTACT,
  type ContactRecord,
  type FicheSuggestions,
} from "@/lib/projects";
import type { ProjectContactsFormState } from "@/schemas/projects.schemas";

type DraftContact = ContactRecord & { key: string };

type ContactField = (typeof CONTACT_FIELDS)[number]["key"];

const INPUT_TYPES: Partial<Record<ContactField, string>> = {
  phone: "tel",
  email: "email",
};

type ProjectContactsProps = {
  projectId: string;
  contacts: ContactRecord[];
  suggestions: Pick<FicheSuggestions, "role" | "company">;
};

function toDraft(contact: ContactRecord): DraftContact {
  return { ...contact, key: crypto.randomUUID() };
}

export function ProjectContacts({
  projectId,
  contacts,
  suggestions,
}: ProjectContactsProps) {
  const formId = useId();
  const headingId = `${formId}-heading`;
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<DraftContact[]>([]);
  const [state, action, saving] = useActionState(
    async (formState: ProjectContactsFormState, formData: FormData) => {
      const next = await saveProjectContacts(formState, formData);
      if (next?.message) {
        toast.success(next.message, SAVED_TOAST_OPTIONS);
        setEditing(false);
      }
      return next;
    },
    undefined,
  );
  const errors = state?.errors;

  const startEditing = () => {
    setDrafts((contacts.length ? contacts : [EMPTY_CONTACT]).map(toDraft));
    setEditing(true);
  };

  const updateDraft = (key: string, field: ContactField, value: string) =>
    setDrafts((current) =>
      current.map((draft) =>
        draft.key === key ? { ...draft, [field]: value } : draft,
      ),
    );

  const serialized = JSON.stringify(drafts.map(({ key: _key, ...c }) => c));

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={headingId} className="text-base font-semibold tracking-tight">
          {CONTACTS_HEADING}
        </h2>
        {editing ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDrafts((d) => [...d, toDraft(EMPTY_CONTACT)])}
          >
            <Plus />
            {ADD_CONTACT_LABEL}
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={startEditing}>
            {EDIT_LABEL}
          </Button>
        )}
      </div>

      {!editing &&
        (contacts.length === 0 ? (
          <p className="text-muted-foreground text-sm italic">
            {NO_CONTACTS_LABEL}
          </p>
        ) : (
          <ul className="divide-y">
            {contacts.map((contact, index) => (
              <li
                key={index}
                className="flex flex-wrap items-center gap-2 py-1.5 text-sm"
              >
                {contact.role && (
                  <Badge variant="secondary" className="uppercase">
                    {contact.role}
                  </Badge>
                )}
                <span className="font-medium">{contactHeadline(contact)}</span>
                <span className="text-muted-foreground">
                  {contactDetails(contact)}
                </span>
              </li>
            ))}
          </ul>
        ))}

      {editing && (
        <form action={action} className="flex flex-col gap-3">
          <FormValidationAlerts errors={errors} />
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="contacts" value={serialized} />
          <ul className="flex flex-col gap-2">
            {drafts.map((draft, index) => (
              <li
                key={draft.key}
                className="bg-card grid grid-cols-2 items-start gap-2 rounded-lg border p-2.5 md:grid-cols-[1.1fr_1.3fr_1.2fr_1fr_1.3fr_auto]"
              >
                {CONTACT_FIELDS.map(({ key, label, placeholder }) => {
                  const id = `${formId}-${draft.key}-${key}`;
                  const fieldErrors = errors?.[`contacts.${index}.${key}`];
                  return (
                    <Field key={key} className="gap-1">
                      <FieldLabel htmlFor={id} className="text-xs">
                        {label}
                      </FieldLabel>
                      {key === "role" || key === "company" ? (
                        <SuggestInput
                          id={id}
                          suggestions={suggestions[key]}
                          value={draft[key]}
                          onValueChange={(v) => updateDraft(draft.key, key, v)}
                          placeholder={placeholder}
                          invalid={!!fieldErrors}
                        />
                      ) : (
                        <Input
                          id={id}
                          type={INPUT_TYPES[key]}
                          value={draft[key]}
                          onChange={(e) =>
                            updateDraft(draft.key, key, e.target.value)
                          }
                          placeholder={placeholder}
                          aria-invalid={!!fieldErrors}
                        />
                      )}
                      <FieldErrors errors={fieldErrors} />
                    </Field>
                  );
                })}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={REMOVE_CONTACT_LABEL}
                  className="justify-self-end md:mt-5"
                  onClick={() =>
                    setDrafts((current) =>
                      current.filter(({ key }) => key !== draft.key),
                    )
                  }
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditing(false)}
            >
              {CANCEL_LABEL}
            </Button>
            <Button type="submit" disabled={saving}>
              {SAVE_LABEL}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
