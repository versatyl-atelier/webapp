import { getAllProjects, getProjects } from "@/actions/projects";
import { ProjectsFilter } from "@/components/ProjectsFilter";
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

export async function ProjetsFilter() {
  const projects = await loadProjects();

  return (
    <ProjectsFilter
      projects={projects.map(({ id, name, isDeleted, color }) => ({
        id,
        name,
        isDeleted,
        color,
      }))}
    />
  );
}
