"use client";

import { Suspense, use, useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxInput,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { usePageContext } from "@/app/punch/employe/[id]/context-provider";

import { ProjectType } from "@/generated/prisma/enums";
import { stringifyItemKey } from "@/lib/itemKey";

export type ProjectOrTask = {
  id: string | number;
  type: ProjectType;
};
type ProjectSelectProps = {
  title?: string | null;
  multiple?: boolean;
  maxSelections?: number;
  defaultSelected?: ProjectOrTask | ProjectOrTask[];
  className?: string;
  disabled?: boolean;
};

type Option = {
  key: string;
  type: ProjectType;
  name: string;
};
type OptionGroup = {
  label: string;
  type: ProjectType;
  items: Option[];
};

const emptySingleKey = stringifyItemKey({ type: ProjectType.trello, id: "" });

function isSameOption(a: Option, b: Option) {
  return a.key === b.key;
}
function optionLabel(option: Option) {
  return option.name;
}
function optionKey(option: Option) {
  return option.key;
}

export default function ProjectSelect({
  title = null,
  multiple = false,
  maxSelections,
  defaultSelected,
  className = "",
  disabled = false,
}: ProjectSelectProps) {
  const { projectsPromise, tasksPromise } = usePageContext();
  const projects = use(projectsPromise) || [];
  const tasks = use(tasksPromise) || [];

  const toOption =
    (type: ProjectType) =>
    ({ id, name }: { id: string | number; name: string }): Option => ({
      key: stringifyItemKey({ type, id }),
      type,
      name,
    });
  const groups: OptionGroup[] = [
    {
      label: "Tâches",
      type: ProjectType.task,
      items: tasks.map(toOption(ProjectType.task)),
    },
    {
      label: "Projets Trello",
      type: ProjectType.trello,
      items: projects.map(toOption(ProjectType.trello)),
    },
  ];

  const [selected, setSelected] = useState<Option[]>(() => {
    const defaults = defaultSelected
      ? Array.isArray(defaultSelected)
        ? defaultSelected
        : [defaultSelected]
      : [];
    const keys = defaults.map(stringifyItemKey);
    return groups
      .flatMap(({ items }) => items)
      .filter(({ key }) => keys.includes(key));
  });

  function handleValueChange(value: Option | Option[] | null) {
    const next = Array.isArray(value) ? value : value ? [value] : [];
    if (typeof maxSelections === "number" && next.length > maxSelections) {
      return;
    }
    setSelected(next);
  }

  const label =
    title === null
      ? multiple
        ? `Projet(s)/Tâche(s)${maxSelections ? ` (jusqu\'à ${maxSelections})` : ""}`
        : "Projet/Tâche"
      : title;

  return (
    <Field className={className}>
      <FieldLabel className="mb-1 block text-xs font-semibold text-black uppercase">
        {label}
      </FieldLabel>
      <Suspense
        fallback={
          <Input
            type="text"
            disabled
            className="w-full rounded border-2 border-black bg-gray-100 px-2.5 py-2 text-xs text-gray-600"
          />
        }
      >
        <Combobox
          items={groups}
          multiple={multiple}
          value={multiple ? selected : (selected[0] ?? null)}
          onValueChange={handleValueChange}
          isItemEqualToValue={isSameOption}
          itemToStringLabel={optionLabel}
          itemToStringValue={optionKey}
          disabled={disabled}
        >
          <div className="relative">
            {multiple ? (
              <ComboboxChips className="border-punch-accent rounded-xs border-2 bg-white">
                {selected.map((option) => (
                  <ComboboxChip key={option.key}>{option.name}</ComboboxChip>
                ))}
                <ComboboxChipsInput
                  placeholder={`Rechercher jusqu\`à ${maxSelections} projets...`}
                  className="border-punch-accent placeholder:text-punch-dark/70"
                />
              </ComboboxChips>
            ) : (
              <ComboboxInput
                className="border-punch-accent bg-punch-light/40 rounded-xs border-2 [&>div>button]:rounded-full [&>div>button]:text-white [&>div>button]:hover:text-white"
                placeholder="Rechercher un projet..."
                showClear
              />
            )}
          </div>
          <ComboboxContent
            side="top"
            sideOffset={8}
            className="max-h-75 rounded border-2 border-black bg-white shadow-lg"
          >
            <ComboboxEmpty>Aucun projet ou tâche trouvé</ComboboxEmpty>
            <ComboboxList>
              {(group: OptionGroup, index: number) => (
                <ComboboxGroup key={group.label} items={group.items}>
                  {index > 0 && <ComboboxSeparator />}
                  <ComboboxLabel className="bg-black py-2 font-bold text-white uppercase">
                    {group.label}
                  </ComboboxLabel>
                  <ComboboxCollection>
                    {(option: Option) => (
                      <ComboboxItem
                        key={option.key}
                        value={option}
                        className={
                          group.type === ProjectType.task
                            ? "text-punch-dark text-md border-l-punch-accent-hover border-y-punch-light hover:bg-punch-accent-hover data-highlighted:bg-punch-accent-hover cursor-pointer rounded-none border-b border-l-4 px-2.5 py-2.5 transition-all hover:translate-x-1 hover:text-white"
                            : "text-punch-dark text-md border-l-punch-accent border-y-punch-light hover:bg-punch-accent data-highlighted:bg-punch-accent border-r-punch-light cursor-pointer rounded-none border-r-4 border-b border-l-4 px-2.5 py-2.5 transition-all hover:translate-x-1 hover:border-r-0 hover:text-white"
                        }
                      >
                        {option.name}
                      </ComboboxItem>
                    )}
                  </ComboboxCollection>
                </ComboboxGroup>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        {multiple ? (
          <input
            type="hidden"
            name="projectIds"
            value={JSON.stringify(selected.map(optionKey))}
          />
        ) : (
          <input
            type="hidden"
            name="projectId"
            value={selected[0]?.key ?? emptySingleKey}
          />
        )}
        {multiple && maxSelections && selected.length > 0
          ? `${selected.length}/${maxSelections}`
          : ""}
      </Suspense>
    </Field>
  );
}
