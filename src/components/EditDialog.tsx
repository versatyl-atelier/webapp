"use client";

import { Pencil } from "lucide-react";
import { useState, type ReactNode } from "react";

import { ActionTooltip } from "@/components/ActionTooltip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ACTION_TONE_CLASSES, type ActionTone } from "@/constants/actions";

type EditDialogProps = {
  title: string;
  label: string;
  icon?: ReactNode;
  tone?: ActionTone;
  triggerText?: string;
  children: (close: () => void) => ReactNode;
};

export function EditDialog({
  title,
  label,
  icon = <Pencil />,
  tone = "edit",
  triggerText,
  children,
}: EditDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {triggerText ? (
        <DialogTrigger
          render={
            <Button
              type="button"
              size="sm"
              className="rounded-sm text-xs font-semibold uppercase"
            />
          }
        >
          {triggerText}
        </DialogTrigger>
      ) : (
        <ActionTooltip
          label={label}
          render={
            <DialogTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={label}
                  className={ACTION_TONE_CLASSES[tone]}
                />
              }
            />
          }
        >
          {icon}
        </ActionTooltip>
      )}
      <DialogContent className="border-2">
        <DialogHeader className="border-primary mb-4 border-b-4 pb-2.5 text-center">
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
        </DialogHeader>
        {children(() => setIsOpen(false))}
      </DialogContent>
    </Dialog>
  );
}
