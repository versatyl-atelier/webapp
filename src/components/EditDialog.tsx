"use client";

import { Pencil } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type EditDialogProps = {
  title: string;
  label: string;
  children: (close: () => void) => ReactNode;
};

export function EditDialog({ title, label, children }: EditDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={label}
          />
        }
      >
        <Pencil />
      </DialogTrigger>
      <DialogContent className="border-2">
        <DialogHeader className="border-primary mb-4 border-b-4 pb-2.5 text-center">
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
        </DialogHeader>
        {children(() => setIsOpen(false))}
      </DialogContent>
    </Dialog>
  );
}
