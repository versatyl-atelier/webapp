"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { addLanceurOption, deleteLanceurOption } from "@/actions/lanceur";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  LANCEUR_ADD_OPTION_LABEL,
  LANCEUR_DELETE_OPTION_LABEL,
  LANCEUR_MANAGE_OPTIONS_LABEL,
  LANCEUR_NEW_OPTION_PLACEHOLDER,
  LANCEUR_OPTION_FIELDS,
  LANCEUR_OPTION_TITLES,
} from "@/constants/lanceur";
import { notifyLanceurChange } from "@/hooks/use-lanceur-sync";
import type { LanceurOptionField } from "@/generated/prisma/enums";

export type LanceurOptionRecord = {
  id: number;
  field: LanceurOptionField;
  value: string;
};

type LanceurOptionsDialogProps = {
  options: LanceurOptionRecord[];
};

export function LanceurOptionsDialog({ options }: LanceurOptionsDialogProps) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function add(field: LanceurOptionField) {
    const value = drafts[field] ?? "";
    startTransition(async () => {
      const result = await addLanceurOption({ field, value });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setDrafts((current) => ({ ...current, [field]: "" }));
      notifyLanceurChange();
    });
  }

  function remove(id: number) {
    startTransition(async () => {
      await deleteLanceurOption(id);
      notifyLanceurChange();
    });
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            {LANCEUR_MANAGE_OPTIONS_LABEL}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{LANCEUR_MANAGE_OPTIONS_LABEL}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 sm:grid-cols-2">
          {LANCEUR_OPTION_FIELDS.map((field) => (
            <section key={field} className="grid content-start gap-2">
              <h3 className="text-sm font-semibold">
                {LANCEUR_OPTION_TITLES[field]}
              </h3>
              <ul className="grid gap-1">
                {options
                  .filter((option) => option.field === field)
                  .map((option) => (
                    <li
                      key={option.id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span>{option.value}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={pending}
                        aria-label={`${LANCEUR_DELETE_OPTION_LABEL} ${option.value}`}
                        onClick={() => remove(option.id)}
                      >
                        <Trash2 />
                      </Button>
                    </li>
                  ))}
              </ul>
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  add(field);
                }}
              >
                <Input
                  value={drafts[field] ?? ""}
                  placeholder={LANCEUR_NEW_OPTION_PLACEHOLDER}
                  aria-label={`${LANCEUR_OPTION_TITLES[field]}: ${LANCEUR_NEW_OPTION_PLACEHOLDER}`}
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [field]: event.target.value,
                    }))
                  }
                />
                <Button type="submit" size="sm" disabled={pending}>
                  {LANCEUR_ADD_OPTION_LABEL}
                </Button>
              </form>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
