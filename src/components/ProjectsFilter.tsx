"use client";

import { ChevronDown, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { PROJECT_TAB_PARAM } from "@/constants/projects";
import { projectPath } from "@/lib/paths";
import { findProjectTab, type ProjectTab } from "@/lib/projectTabs";
import { projectColorLabel, projectColorStyle } from "@/lib/projects";
import { normalize } from "@/lib/text";

export type FilterableProject = {
  id: string;
  name: string;
  isDeleted: boolean;
  color: string;
};

type ProjectGroupProps = {
  label: string;
  projects: FilterableProject[];
  tab?: ProjectTab;
};

function ProjectGroup({ label, projects, tab }: ProjectGroupProps) {
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
              {projects.map(({ id, name, color }) => (
                <SidebarMenuItem key={id}>
                  <SidebarMenuButton asChild>
                    <Link href={projectPath(id, tab)} title={name}>
                      <span
                        aria-hidden
                        title={projectColorLabel(color)}
                        style={projectColorStyle(color)}
                        className="size-2 shrink-0 rounded-full bg-(--project-color)"
                      />
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
  const tab = findProjectTab(useSearchParams().get(PROJECT_TAB_PARAM));
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
              autoFocus
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
      <ProjectGroup label="Actifs" projects={active} tab={tab} />
      <ProjectGroup label="Archivés" projects={archived} tab={tab} />
    </>
  );
}
