"use client";

import { Search, X } from "lucide-react";
import { useId, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";

import { importLanceurPhases } from "@/actions/lanceur";
import { ActionTooltip } from "@/components/ActionTooltip";
import { LanceurIntakeFields } from "@/components/LanceurIntakeFields";
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
} from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  INTAKE_CLEAR_LABEL,
  INTAKE_NO_RESULT_LABEL,
  INTAKE_NO_SELECTION_MESSAGE,
  INTAKE_PHASES_LABEL,
  INTAKE_SEARCH_LABEL,
  INTAKE_SEARCH_LIMIT,
  INTAKE_SEARCH_PLACEHOLDER,
  INTAKE_SUBMITTED_MESSAGE,
  INTAKE_SUBMIT_LABEL,
} from "@/constants/lanceurIntake";
import { LANCEUR_SAVE_ERROR_MESSAGE } from "@/constants/lanceur";
import { notifyLanceurChange } from "@/hooks/use-lanceur-sync";
import type { LanceurEmployee } from "@/lib/lanceur";
import {
  EMPTY_SLOT_FORM,
  buildIntakeEntries,
  type IntakeProject,
  type SlotForm,
} from "@/lib/lanceurIntake";
import { searchProjects } from "@/lib/projectHome";
import { projectColorStyle } from "@/lib/projects";

type LanceurIntakePanelProps = {
  projects: IntakeProject[];
  etapes: string[];
  installateurs: string[];
  employees: LanceurEmployee[];
};

export function LanceurIntakePanel({
  projects,
  etapes,
  installateurs,
  employees,
}: LanceurIntakePanelProps) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [project, setProject] = useState<IntakeProject | null>(null);
  const [forms, setForms] = useState<Record<string, SlotForm>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const results = searchProjects(projects, query, INTAKE_SEARCH_LIMIT);

  function reset() {
    setProject(null);
    setQuery("");
    setForms({});
    setErrors({});
  }

  function pick(next: IntakeProject) {
    setProject(next);
    setQuery("");
    setErrors({});
    setForms(
      next.slots.length === 1 ? { [next.slots[0].key]: EMPTY_SLOT_FORM } : {},
    );
  }

  function toggleSlot(key: string, checked: boolean) {
    setForms((current) => {
      const { [key]: _removed, ...rest } = current;
      return checked ? { ...current, [key]: EMPTY_SLOT_FORM } : rest;
    });
  }

  function updateForm(key: string, patch: Partial<SlotForm>) {
    setForms((current) => ({
      ...current,
      [key]: { ...current[key], ...patch },
    }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project) {
      return;
    }
    const built = buildIntakeEntries(project.id, project.slots, forms);
    setErrors(built.errors);
    if (Object.keys(built.errors).length > 0) {
      return;
    }
    if (built.entries.length === 0) {
      toast.error(INTAKE_NO_SELECTION_MESSAGE);
      return;
    }
    startTransition(async () => {
      try {
        const result = await importLanceurPhases(built.entries);
        if (result?.error) {
          toast.error(result.error);
          return;
        }
        toast.success(INTAKE_SUBMITTED_MESSAGE);
        notifyLanceurChange();
        reset();
      } catch {
        toast.error(LANCEUR_SAVE_ERROR_MESSAGE);
      }
    });
  }

  if (!project) {
    return (
      <div role="search" className="grid gap-1.5">
        <Label htmlFor={inputId} className="sr-only">
          {INTAKE_SEARCH_LABEL}
        </Label>
        <Autocomplete
          items={results}
          value={query}
          onValueChange={setQuery}
          itemToStringValue={(item: IntakeProject) => item.name}
          filter={null}
          autoHighlight
        >
          <div className="relative">
            <Search
              aria-hidden
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
            />
            <AutocompleteInput
              id={inputId}
              type="search"
              placeholder={INTAKE_SEARCH_PLACEHOLDER}
              className="h-8 pl-8 text-xs md:text-xs"
            />
          </div>
          <AutocompleteContent>
            <AutocompleteList>
              {(item: IntakeProject) => (
                <AutocompleteItem
                  key={item.id}
                  value={item}
                  onClick={() => pick(item)}
                  style={projectColorStyle(item.color)}
                  className="gap-2 border-l-4 border-l-(--project-color) text-xs"
                >
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                </AutocompleteItem>
              )}
            </AutocompleteList>
          </AutocompleteContent>
        </Autocomplete>
        {query.trim() !== "" && results.length === 0 && (
          <p className="text-muted-foreground text-xs">
            {INTAKE_NO_RESULT_LABEL}
          </p>
        )}
      </div>
    );
  }

  const isMultiple = project.slots.length > 1;

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div
        style={projectColorStyle(project.color)}
        className="flex items-center gap-2 rounded-md border border-l-4 border-l-(--project-color) py-1 pr-1 pl-2"
      >
        <span className="min-w-0 flex-1 truncate text-xs font-semibold">
          {project.name}
        </span>
        <ActionTooltip
          label={INTAKE_CLEAR_LABEL}
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={INTAKE_CLEAR_LABEL}
              onClick={reset}
            />
          }
        >
          <X />
        </ActionTooltip>
      </div>
      {isMultiple && (
        <p className="text-2xs font-semibold uppercase">
          {INTAKE_PHASES_LABEL}
        </p>
      )}
      {project.slots.map((slot) => {
        const form = forms[slot.key];
        return (
          <fieldset key={slot.key} className="grid gap-2">
            {isMultiple ? (
              <label className="flex items-center gap-2 text-xs font-medium">
                <Checkbox
                  checked={form !== undefined}
                  onCheckedChange={(checked) => toggleSlot(slot.key, checked)}
                />
                {slot.name}
              </label>
            ) : null}
            {form && (
              <LanceurIntakeFields
                form={form}
                error={errors[slot.key]}
                etapes={etapes}
                installateurs={installateurs}
                employees={employees}
                onChange={(patch) => updateForm(slot.key, patch)}
              />
            )}
          </fieldset>
        );
      })}
      <Button type="submit" size="sm" disabled={pending}>
        {INTAKE_SUBMIT_LABEL}
      </Button>
    </form>
  );
}
