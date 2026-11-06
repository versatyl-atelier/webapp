import { getProjectHome } from "@/actions/projects";
import { ProjectRow } from "@/components/ProjectRow";
import { ProjectSearch } from "@/components/ProjectSearch";
import {
  NO_PINNED_PROJECTS_LABEL,
  NO_RECENT_PROJECTS_LABEL,
  PINNED_PROJECTS_HEADING,
  RECENT_PROJECTS_HEADING,
} from "@/constants/projectHome";
import { requireActiveSession } from "@/lib/session";
import { loadProjects } from "./ProjetsFilter";

export default async function Page() {
  await requireActiveSession("/projets");
  const [home, projects] = await Promise.all([
    getProjectHome(),
    loadProjects(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 pt-[12svh] pb-16">
      <ProjectSearch
        projects={projects.map(({ id, name, isDeleted, color }) => ({
          id,
          name,
          isDeleted,
          color,
        }))}
      />
      <div className="flex flex-col gap-8">
        <ProjectRow
          heading={RECENT_PROJECTS_HEADING}
          emptyLabel={NO_RECENT_PROJECTS_LABEL}
          projects={home.recent}
          pinned={false}
        />
        <ProjectRow
          heading={PINNED_PROJECTS_HEADING}
          emptyLabel={NO_PINNED_PROJECTS_LABEL}
          projects={home.pinned}
          pinned
        />
      </div>
    </div>
  );
}
