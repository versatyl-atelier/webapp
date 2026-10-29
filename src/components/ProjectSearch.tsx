"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";

import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
} from "@/components/ui/autocomplete";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  ARCHIVED_PROJECT_LABEL,
  NO_SEARCH_RESULT_LABEL,
  PROJECT_SEARCH_LABEL,
  PROJECT_SEARCH_PLACEHOLDER,
} from "@/constants/projectHome";
import { projectPath } from "@/lib/paths";
import { searchProjects, type SearchableProject } from "@/lib/projectHome";
import { projectColorStyle } from "@/lib/projects";

type ProjectSearchProps = {
  projects: SearchableProject[];
};

export function ProjectSearch({ projects }: ProjectSearchProps) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const results = searchProjects(projects, query);
  const hasQuery = query.trim().length > 0;

  return (
    <form
      role="search"
      onSubmit={(event) => event.preventDefault()}
      className="mx-auto w-full max-w-2xl"
    >
      <Label htmlFor={inputId} className="sr-only">
        {PROJECT_SEARCH_LABEL}
      </Label>
      <Autocomplete
        items={results}
        value={query}
        onValueChange={setQuery}
        itemToStringValue={(project: SearchableProject) => project.name}
        filter={null}
        autoHighlight
      >
        <div className="relative">
          <Search
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
          />
          <AutocompleteInput
            id={inputId}
            type="search"
            placeholder={PROJECT_SEARCH_PLACEHOLDER}
            autoFocus
            className="bg-background h-12 rounded-full pr-5 pl-12 text-base shadow-sm md:text-base"
          />
        </div>
        <AutocompleteContent>
          <AutocompleteList>
            {(project: SearchableProject) => (
              <AutocompleteItem
                key={project.id}
                value={project}
                nativeButton={false}
                render={<Link href={projectPath(project.id)} />}
                style={projectColorStyle(project.color)}
                className="gap-2.5 border-l-4 border-l-(--project-color) py-2 pl-2.5 text-base"
              >
                <span className="min-w-0 flex-1 truncate">{project.name}</span>
                {project.isDeleted && (
                  <Badge variant="outline">{ARCHIVED_PROJECT_LABEL}</Badge>
                )}
              </AutocompleteItem>
            )}
          </AutocompleteList>
        </AutocompleteContent>
      </Autocomplete>
      <p className="sr-only" aria-live="polite">
        {hasQuery && `${results.length} projets trouvés`}
      </p>
      {hasQuery && results.length === 0 && (
        <p className="text-muted-foreground mt-3 text-center text-sm">
          {NO_SEARCH_RESULT_LABEL}
        </p>
      )}
    </form>
  );
}
