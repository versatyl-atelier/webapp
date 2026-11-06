"use client";

import { Mail, MapPin, Phone, Plus } from "lucide-react";
import { useId, useState } from "react";

import { ContactDialog } from "@/components/ContactDialog";
import { ProjectLocationDialog } from "@/components/ProjectLocationDialog";
import { RowTitle } from "@/components/RowTitle";
import { Button } from "@/components/ui/button";
import {
  ADD_CONTACT_LABEL,
  ADD_CONTACT_SHORT_LABEL,
  CONTACTS_HEADING,
  PROJECT_CARD_ADDRESS_FALLBACK,
  PROJECT_CARD_ROLE_LABEL,
} from "@/constants/projects";
import {
  contactHeadline,
  projectColorLabel,
  projectColorStyle,
  type ContactRecord,
  type FicheSuggestions,
} from "@/lib/projects";
import { cn } from "@/lib/utils";

type OpenDialog = "project" | "new" | { contactId: number } | null;

const CARD_CLASS =
  "bg-card focus-within:ring-ring/50 relative flex flex-col gap-1 rounded-xl border p-4 shadow-xs transition-[box-shadow,transform] focus-within:ring-3 hover:-translate-y-px hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0";
const CARD_BUTTON_CLASS =
  "text-left outline-hidden after:absolute after:inset-0";
const CARD_LINK_CLASS =
  "hover:text-primary relative z-10 flex min-w-0 items-center gap-2 truncate";

type ProjectContactsProps = {
  projectId: string;
  project: { color: string; address: string };
  contacts: ContactRecord[];
  suggestions: Pick<FicheSuggestions, "role" | "company">;
};

export function ProjectContacts({
  projectId,
  project,
  contacts,
  suggestions,
}: ProjectContactsProps) {
  const headingId = useId();
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const closeDialog = () => setDialog(null);
  const openContact =
    typeof dialog === "object" && dialog !== null
      ? contacts.find(({ id }) => id === dialog.contactId)
      : undefined;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <RowTitle id={headingId}>{CONTACTS_HEADING}</RowTitle>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(var(--container-contact),1fr))] gap-3.5">
        <li className={CARD_CLASS}>
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
            <span
              aria-hidden
              title={projectColorLabel(project.color)}
              style={projectColorStyle(project.color)}
              className="size-2 shrink-0 rounded-full bg-(--project-color)"
            />
            {PROJECT_CARD_ROLE_LABEL}
          </p>
          <p
            className={cn(
              "font-semibold",
              !project.address && "text-muted-foreground font-medium",
            )}
          >
            <button
              type="button"
              onClick={() => setDialog("project")}
              className={CARD_BUTTON_CLASS}
            >
              {project.address || PROJECT_CARD_ADDRESS_FALLBACK}
            </button>
          </p>
        </li>
        {contacts.map((contact) => (
          <li key={contact.id} className={CARD_CLASS}>
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {contact.role || CONTACTS_HEADING}
            </p>
            <h3 className="font-semibold">
              <button
                type="button"
                onClick={() => setDialog({ contactId: contact.id })}
                className={CARD_BUTTON_CLASS}
              >
                {contactHeadline(contact)}
              </button>
            </h3>
            {contact.name && contact.company && (
              <p className="text-muted-foreground text-sm">{contact.company}</p>
            )}
            {(contact.phone || contact.email || contact.address) && (
              <div className="mt-2 flex flex-col gap-1 text-sm">
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                    className={CARD_LINK_CLASS}
                  >
                    <Phone aria-hidden className="size-3.5 shrink-0" />
                    {contact.phone}
                  </a>
                )}
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className={CARD_LINK_CLASS}
                  >
                    <Mail aria-hidden className="size-3.5 shrink-0" />
                    {contact.email}
                  </a>
                )}
                {contact.address && (
                  <p className="flex min-w-0 items-center gap-2 truncate">
                    <MapPin aria-hidden className="size-3.5 shrink-0" />
                    {contact.address}
                  </p>
                )}
              </div>
            )}
          </li>
        ))}
        <li className="flex">
          <Button
            type="button"
            variant="outline"
            aria-label={ADD_CONTACT_LABEL}
            onClick={() => setDialog("new")}
            className="text-muted-foreground border-input min-h-24 w-full flex-1 rounded-xl border-2 border-dashed bg-transparent"
          >
            <Plus />
            {ADD_CONTACT_SHORT_LABEL}
          </Button>
        </li>
      </ul>

      {dialog === "project" && (
        <ProjectLocationDialog
          projectId={projectId}
          color={project.color}
          address={project.address}
          onClose={closeDialog}
        />
      )}
      {dialog === "new" && (
        <ContactDialog
          projectId={projectId}
          suggestions={suggestions}
          onClose={closeDialog}
        />
      )}
      {openContact && (
        <ContactDialog
          key={openContact.id}
          projectId={projectId}
          suggestions={suggestions}
          contact={openContact}
          onClose={closeDialog}
        />
      )}
    </section>
  );
}
