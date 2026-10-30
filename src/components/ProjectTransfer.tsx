"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ADD_ALL_LABEL,
  ADD_SELECTED_LABEL,
  ARCHIVED_LABEL,
  AVAILABLE_LIST_TITLE,
  ENTRIES_LABEL,
  ENTRY_LABEL,
  LAST_USED_LABEL,
  LIST_SEARCH_PLACEHOLDER,
  NO_MATCH_LABEL,
  NO_PROJECTS_USED_LABEL,
  PROJECT_TYPE_FILTERS,
  PROJECT_TYPE_FILTER_LABELS,
  REMOVE_ALL_LABEL,
  REMOVE_SELECTED_LABEL,
  SELECTED_LIST_TITLE,
  TYPE_FILTER_LABEL,
  type ProjectTypeFilter,
} from "@/constants/report";
import { ProjectType } from "@/generated/prisma/enums";
import { formatDecimalHours } from "@/lib/time";
import { filterProjects, type UsedProject } from "@/lib/report";

type ProjectTransferProps = {
  projects: UsedProject[];
  selectedKeys: string[];
  onChange: (keys: string[]) => void;
};

type ProjectListProps = {
  title: string;
  searchLabel: string;
  projects: UsedProject[];
  total: number;
  checked: ReadonlySet<string>;
  onCheckedChange: (key: string, isChecked: boolean) => void;
  query: string;
  onQueryChange: (query: string) => void;
};

function typeIcon(type: ProjectType) {
  return type === ProjectType.task ? "📋" : "🔷";
}

function ProjectList({
  title,
  searchLabel,
  projects,
  total,
  checked,
  onCheckedChange,
  query,
  onQueryChange,
}: ProjectListProps) {
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-1.5">
      <h3 className="text-xs font-bold uppercase">
        {title} ({total})
      </h3>
      <Input
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={LIST_SEARCH_PLACEHOLDER}
        aria-label={`${searchLabel} ${title.toLowerCase()}`}
        className="w-full rounded border-2 px-1.5 py-1 text-xs"
      />
      <ul className="bg-card h-80 overflow-y-auto rounded border-2">
        {projects.length === 0 ? (
          <li className="text-muted-foreground p-2 text-xs">
            {total === 0 ? NO_PROJECTS_USED_LABEL : NO_MATCH_LABEL}
          </li>
        ) : (
          projects.map((project) => (
            <li key={project.key} className="border-b last:border-b-0">
              <label className="hover:bg-accent flex cursor-pointer items-start gap-2 px-2 py-1.5">
                <Checkbox
                  checked={checked.has(project.key)}
                  onCheckedChange={(isChecked) =>
                    onCheckedChange(project.key, isChecked)
                  }
                  className="mt-0.5"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm wrap-break-word">
                    <span aria-hidden>{typeIcon(project.type)} </span>
                    {project.name}
                    {project.archived && (
                      <span className="text-muted-foreground text-xs">
                        {" "}
                        ({ARCHIVED_LABEL})
                      </span>
                    )}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    {formatDecimalHours(project.hours)} · {project.entries}{" "}
                    {project.entries > 1 ? ENTRIES_LABEL : ENTRY_LABEL}
                    {project.lastDate &&
                      ` · ${LAST_USED_LABEL} ${project.lastDate}`}
                  </span>
                </span>
              </label>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

export function ProjectTransfer({
  projects,
  selectedKeys,
  onChange,
}: ProjectTransferProps) {
  const [typeFilter, setTypeFilter] = useState<ProjectTypeFilter>("all");
  const [availableQuery, setAvailableQuery] = useState("");
  const [selectedQuery, setSelectedQuery] = useState("");
  const [checkedAvailable, setCheckedAvailable] = useState<Set<string>>(
    new Set(),
  );
  const [checkedSelected, setCheckedSelected] = useState<Set<string>>(
    new Set(),
  );

  const selectedSet = new Set(selectedKeys);
  const available = projects.filter(({ key }) => !selectedSet.has(key));
  const selected = projects.filter(({ key }) => selectedSet.has(key));
  const visibleAvailable = filterProjects(
    available,
    typeFilter,
    availableQuery,
  );
  const visibleSelected = filterProjects(selected, typeFilter, selectedQuery);

  function toggle(
    setChecked: (update: (current: Set<string>) => Set<string>) => void,
  ) {
    return (key: string, isChecked: boolean) =>
      setChecked((current) => {
        const next = new Set(current);
        if (isChecked) next.add(key);
        else next.delete(key);
        return next;
      });
  }

  function add(keys: string[]) {
    onChange([...selectedKeys, ...keys.filter((key) => !selectedSet.has(key))]);
    setCheckedAvailable(new Set());
  }

  function remove(keys: string[]) {
    const removed = new Set(keys);
    onChange(selectedKeys.filter((key) => !removed.has(key)));
    setCheckedSelected(new Set());
  }

  const checkedAvailableKeys = visibleAvailable
    .map(({ key }) => key)
    .filter((key) => checkedAvailable.has(key));
  const checkedSelectedKeys = visibleSelected
    .map(({ key }) => key)
    .filter((key) => checkedSelected.has(key));

  return (
    <div className="flex flex-col gap-2.5">
      <Field className="w-52">
        <FieldLabel className="mb-1 block text-xs font-semibold uppercase">
          {TYPE_FILTER_LABEL}
        </FieldLabel>
        <Select
          items={PROJECT_TYPE_FILTER_LABELS}
          value={typeFilter}
          onValueChange={(value) => {
            if (value !== null) setTypeFilter(value);
          }}
        >
          <SelectTrigger className="w-full rounded border-2 px-1.5 py-1 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROJECT_TYPE_FILTERS.map((value) => (
              <SelectItem key={value} value={value}>
                {PROJECT_TYPE_FILTER_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <div className="flex flex-col gap-2.5 md:flex-row md:items-stretch">
        <ProjectList
          title={AVAILABLE_LIST_TITLE}
          searchLabel="Rechercher dans les projets"
          projects={visibleAvailable}
          total={available.length}
          checked={checkedAvailable}
          onCheckedChange={toggle(setCheckedAvailable)}
          query={availableQuery}
          onQueryChange={setAvailableQuery}
        />
        <div className="flex flex-row justify-center gap-1.5 md:flex-col md:self-center">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            title={ADD_SELECTED_LABEL}
            aria-label={ADD_SELECTED_LABEL}
            disabled={checkedAvailableKeys.length === 0}
            onClick={() => add(checkedAvailableKeys)}
          >
            →
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            title={ADD_ALL_LABEL}
            aria-label={ADD_ALL_LABEL}
            disabled={visibleAvailable.length === 0}
            onClick={() => add(visibleAvailable.map(({ key }) => key))}
          >
            ⇒
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            title={REMOVE_SELECTED_LABEL}
            aria-label={REMOVE_SELECTED_LABEL}
            disabled={checkedSelectedKeys.length === 0}
            onClick={() => remove(checkedSelectedKeys)}
          >
            ←
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            title={REMOVE_ALL_LABEL}
            aria-label={REMOVE_ALL_LABEL}
            disabled={selectedKeys.length === 0}
            onClick={() => remove(selectedKeys)}
          >
            ⇐
          </Button>
        </div>
        <ProjectList
          title={SELECTED_LIST_TITLE}
          searchLabel="Rechercher dans les projets"
          projects={visibleSelected}
          total={selected.length}
          checked={checkedSelected}
          onCheckedChange={toggle(setCheckedSelected)}
          query={selectedQuery}
          onQueryChange={setSelectedQuery}
        />
      </div>
    </div>
  );
}
