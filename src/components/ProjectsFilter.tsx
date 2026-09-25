"use client";

import { ChevronDown, Search } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { projectPath } from "@/lib/paths";
import { normalize } from "@/lib/text";

export type FilterableProject = {
  id: string;
  name: string;
  isDeleted: boolean;
};

type ProjectGroupProps = {
  label: string;
  projects: FilterableProject[];
};

function ProjectGroup({ label, projects }: ProjectGroupProps) {
  return (
    <Collapsible defaultOpen asChild>
      <SidebarGroup className="min-h-12">
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="group/trigger hover:bg-sidebar-accent w-full cursor-pointer justify-between uppercase">
            <span>
              {label} ({projects.length})
            </span>
            <ChevronDown
              aria-hidden="true"
              className="transition-transform group-data-[state=open]/trigger:rotate-180"
            />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent className="min-h-0 overflow-y-auto">
          {projects.length === 0 ? (
            <p className="text-muted-foreground px-2 text-sm">Aucun projet</p>
          ) : (
            <SidebarMenu>
              {projects.map(({ id, name }) => (
                <SidebarMenuItem key={id}>
                  <SidebarMenuButton asChild>
                    <Link href={projectPath(id)} title={name}>
                      <span className="truncate">{name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          )}
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

type ProjectsFilterProps = {
  projects: FilterableProject[];
};

export function ProjectsFilter({ projects }: ProjectsFilterProps) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const needle = normalize(query);
  const matches = projects.filter(({ name }) =>
    normalize(name).includes(needle),
  );
  const active = matches.filter(({ isDeleted }) => !isDeleted);
  const archived = matches.filter(({ isDeleted }) => isDeleted);

  return (
    <>
      <form role="search" onSubmit={(event) => event.preventDefault()}>
        <SidebarGroup className="shrink-0 py-0">
          <SidebarGroupContent className="relative">
            <Label htmlFor={inputId} className="sr-only">
              Filtrer les projets
            </Label>
            <SidebarInput
              id={inputId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filtrer les projets…"
              className="pl-8"
            />
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none"
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </form>
      <p className="sr-only" aria-live="polite">
        {matches.length} projets trouvés
      </p>
      <ProjectGroup label="Actifs" projects={active} />
      <ProjectGroup label="Archivés" projects={archived} />
    </>
  );
}
