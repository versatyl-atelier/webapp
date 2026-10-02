import { getAllProjects, getProjects } from "@/actions/projects";
import { ProjectsFilter } from "@/components/ProjectsFilter";
import { ToolSidebar } from "@/components/ToolSidebar";
import { Button } from "@/components/ui/button";
import {
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Role } from "@/generated/prisma/enums";
import { requireActiveSession } from "@/lib/session";

async function loadProjects() {
  const session = await requireActiveSession("/projets");
  if (session.role === Role.manager) {
    return getAllProjects();
  }
  if (session.employeeId === null) {
    return [];
  }
  return getProjects(session.employeeId);
}

export async function ProjetsSidebar() {
  const projects = await loadProjects();

  return (
    <ToolSidebar glyph="📁" title="Projets" href="/projets">
      <SidebarContent>
        <ProjectsFilter
          projects={projects.map(({ id, name, isDeleted, color }) => ({
            id,
            name,
            isDeleted,
            color,
          }))}
        />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuButton asChild>
            <Button variant="default">+ Nouveau projet</Button>
          </SidebarMenuButton>
        </SidebarMenu>
      </SidebarFooter>
    </ToolSidebar>
  );
}
