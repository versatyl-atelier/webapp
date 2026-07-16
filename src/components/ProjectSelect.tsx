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
import { usePageContext } from "@/app/employee/[id]/context-provider";

import { ProjectType } from "@/generated/prisma/enums";
import { parseItemKey, stringifyItemKey } from "../lib/itemKey";

export type ProjectOrTask = {
  id: string | number;
  type: ProjectType;
};
type ProjectSelectProps = {
  multiple?: boolean;
  maxSelections?: number;
  defaultSelected?: ProjectOrTask | ProjectOrTask[];
  className?: string;
};

export default function ProjectSelect({
  multiple = false,
  maxSelections,
  defaultSelected,
  className = "",
}: ProjectSelectProps) {
  const { projectsPromise, tasksPromise } = usePageContext();
  const projects = use(projectsPromise) || [];
  const tasks = use(tasksPromise) || [];
  const defaultValue = multiple ? [] : { type: ProjectType.trello, id: "" };
  const [selected, setSelected] = useState(
    multiple
      ? defaultSelected || defaultValue
      : defaultSelected || defaultValue,
  );

  function getProjectOrTask({ id, type }: ProjectOrTask) {
    return (type === ProjectType.task ? tasks : projects).find(
      ({ id: foundId }) => foundId.toString() === id,
    );
  }

  function getProjectName(value: string) {
    return getProjectOrTask(parseItemKey(value))?.name || value;
  }

  const value = Array.isArray(selected)
    ? selected.map(stringifyItemKey)
    : stringifyItemKey(selected);

  function handleValuesChange(values?: string[]) {
    if (!values) {
      return setSelected(defaultValue);
    }
    return typeof maxSelections === "undefined" ||
      values.length <= maxSelections
      ? setSelected(values.map((value) => parseItemKey(value)))
      : null;
  }
  function handleValueChange(value?: string) {
    setSelected(value ? parseItemKey(value) : defaultValue);
  }

  return (
    <Field className={className}>
      <FieldLabel className="mb-1 block text-xs font-semibold text-black uppercase">
        {multiple
          ? `Projet(s)/Tâche(s)${maxSelections ? ` (jusqu\'à ${maxSelections})` : ""}`
          : "Projet/Tâche"}
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
          multiple={multiple}
          limit={maxSelections}
          value={value}
          onValueChange={(val) => {
            return val
              ? Array.isArray(val)
                ? handleValuesChange(val)
                : handleValueChange(val)
              : setSelected(defaultValue);
          }}
          name={multiple ? "projectIds" : "projectId"}
        >
          <div className="relative">
            {multiple ? (
              <ComboboxChips className="border-punch-accent rounded-xs border-2 bg-white">
                {Array.isArray(selected) &&
                  selected.map((item) => {
                    const key = stringifyItemKey(item);
                    return (
                      <ComboboxChip key={key}>
                        {getProjectName(key)}
                      </ComboboxChip>
                    );
                  })}
                <ComboboxChipsInput
                  placeholder={`Rechercher jusqu\`à ${maxSelections} projets...`}
                  className="border-punch-accent placeholder:text-punch-dark/70"
                  value={undefined}
                />
              </ComboboxChips>
            ) : (
              <ComboboxInput
                className="border-punch-accent bg-punch-light/40 [&>div>button]:bg-punch-accent [&>div>button]:hover:bg-punch-accent-hover rounded-xs border-2 [&>div>button]:rounded-full [&>div>button]:text-white [&>div>button]:hover:text-white [&>div>button>svg]:size-0.5"
                placeholder="Rechercher un projet..."
                value={getProjectName(value as string)}
                showClear
              />
            )}
          </div>
          <ComboboxContent
            side="top"
            sideOffset={8}
            className="max-h-75 rounded border-2 border-black bg-white shadow-lg"
          >
            <ComboboxList>
              <ComboboxGroup key="tasks" items={tasks}>
                <ComboboxLabel className="bg-black py-2 font-bold text-white uppercase">
                  Tâches
                </ComboboxLabel>
                {tasks.length === 0 && (
                  <ComboboxEmpty>Aucune tâche trouvée</ComboboxEmpty>
                )}
                <ComboboxCollection>
                  {(task) => (
                    <ComboboxItem
                      key={task.id}
                      value={stringifyItemKey({
                        type: ProjectType.task,
                        id: task.id,
                      })}
                      className="text-punch-dark text-md border-l-punch-accent-hover border-y-punch-light hover:bg-punch-accent-hover data-highlighted:bg-punch-accent-hover cursor-pointer rounded-none border-b border-l-4 px-2.5 py-2.5 transition-all hover:translate-x-1 hover:text-white"
                    >
                      {task.name}
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
              <ComboboxSeparator />
              <ComboboxGroup key="projets" items={projects}>
                <ComboboxLabel className="bg-black py-2 font-bold text-white uppercase">
                  Projets Trello
                </ComboboxLabel>
                {projects.length === 0 && (
                  <ComboboxEmpty>Aucun projet trouvé</ComboboxEmpty>
                )}
                <ComboboxCollection>
                  {(project) => (
                    <ComboboxItem
                      key={project.id}
                      value={stringifyItemKey({
                        type: ProjectType.trello,
                        id: project.id,
                      })}
                      className="text-punch-dark text-md border-l-punch-accent border-y-punch-light hover:bg-punch-accent data-highlighted:bg-punch-accent border-r-punch-light cursor-pointer rounded-none border-r-4 border-b border-l-4 px-2.5 py-2.5 transition-all hover:translate-x-1 hover:border-r-0 hover:text-white"
                    >
                      {project.name}
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        {multiple && Array.isArray(selected) && (
          <input
            type="hidden"
            name="projectIds"
            value={JSON.stringify(selected.map(stringifyItemKey))}
          />
        )}
        {multiple &&
        Array.isArray(selected) &&
        maxSelections &&
        selected.length > 0
          ? `${selected.length}/${maxSelections}`
          : ""}
      </Suspense>
    </Field>
  );
}
