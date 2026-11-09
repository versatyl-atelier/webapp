"use client";

import { EditDialog } from "@/components/EditDialog";
import { PersonForm } from "@/components/PersonForm";
import { EDIT_PERSON_LABEL, EDIT_PERSON_TITLE } from "@/constants/accounts";
import type { Person } from "@/lib/accounts";

type EditPersonDialogProps = {
  person: Person;
  statuts: { id: string; description: string }[];
  isCurrentUser: boolean;
};

export function EditPersonDialog({
  person,
  statuts,
  isCurrentUser,
}: EditPersonDialogProps) {
  return (
    <EditDialog
      title={`${EDIT_PERSON_TITLE} ${person.name}`}
      label={`${EDIT_PERSON_LABEL} ${person.name}`}
    >
      {(close) => (
        <PersonForm
          person={person}
          statuts={statuts}
          isCurrentUser={isCurrentUser}
          onSaved={close}
        />
      )}
    </EditDialog>
  );
}
