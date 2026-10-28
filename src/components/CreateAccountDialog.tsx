"use client";

import { UserPlus } from "lucide-react";

import { CreateAccountForm } from "@/components/CreateAccountForm";
import { EditDialog } from "@/components/EditDialog";
import {
  ADD_ACCOUNT_LABEL,
  CREATE_ACCOUNT_LABEL,
  CREATE_ACCOUNT_TITLE,
} from "@/constants/accounts";

type CreateAccountDialogProps = {
  employees?: { id: number; name: string }[];
  employee?: { id: number; name: string };
};

export function CreateAccountDialog({
  employees,
  employee,
}: CreateAccountDialogProps) {
  return (
    <EditDialog
      title={
        employee
          ? `${CREATE_ACCOUNT_TITLE} — ${employee.name}`
          : CREATE_ACCOUNT_TITLE
      }
      label={
        employee
          ? `${ADD_ACCOUNT_LABEL} ${employee.name}`
          : CREATE_ACCOUNT_LABEL
      }
      icon={<UserPlus />}
      triggerText={employee ? undefined : CREATE_ACCOUNT_LABEL}
    >
      {(close) => (
        <CreateAccountForm
          employees={employees}
          employee={employee}
          onDone={close}
        />
      )}
    </EditDialog>
  );
}
