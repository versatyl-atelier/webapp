"use client";

import { KeyRound } from "lucide-react";

import { EditDialog } from "@/components/EditDialog";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { RESET_PASSWORD_LABEL } from "@/constants/accounts";

type ResetPasswordDialogProps = {
  userId: string;
  name: string;
};

export function ResetPasswordDialog({
  userId,
  name,
}: ResetPasswordDialogProps) {
  return (
    <EditDialog
      title={`${RESET_PASSWORD_LABEL} — ${name}`}
      label={`${RESET_PASSWORD_LABEL} ${name}`}
      icon={<KeyRound />}
    >
      {(close) => <ResetPasswordForm userId={userId} onDone={close} />}
    </EditDialog>
  );
}
