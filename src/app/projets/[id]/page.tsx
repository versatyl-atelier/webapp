import { notFound } from "next/navigation";

import {
  getFicheSuggestions,
  getProject,
  getProjectNotes,
} from "@/actions/projects";
import { ProjectContacts } from "@/components/ProjectContacts";
import { ProjectHeader } from "@/components/ProjectHeader";
import { ProjectNotes } from "@/components/ProjectNotes";
import { ProjectPieces } from "@/components/ProjectPieces";
import { ProjectTabs } from "@/components/ProjectTabs";
import { TabsContent } from "@/components/ui/tabs";
import {
  NOTES_TAB,
  PROJECT_TAB_PARAM,
  PROJECT_TABS,
  STRUCTURE_TAB,
} from "@/constants/projects";
import { projectPath } from "@/lib/paths";
import { parseProjectTab } from "@/lib/projectTabs";
import { requireActiveSession } from "@/lib/session";

type ProjectPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ params, searchParams }: ProjectPageProps) {
  const { id } = await params;
  const session = await requireActiveSession(projectPath(id));
  const [project, suggestions, notes] = await Promise.all([
    getProject(id),
    getFicheSuggestions(),
    getProjectNotes(id),
  ]);

  if (!project) {
    return notFound();
  }

  const query = await searchParams;
  const tab = parseProjectTab(query[PROJECT_TAB_PARAM]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 pt-6 pb-16">
      <ProjectHeader project={project} />
      <ProjectContacts
        projectId={project.id}
        contacts={project.contacts}
        suggestions={suggestions}
      />
      <ProjectTabs tab={tab}>
        {PROJECT_TABS.map(({ value }) => (
          <TabsContent key={value} value={value}>
            {value === STRUCTURE_TAB ? (
              <div className="flex flex-col gap-8 pt-4">
                <ProjectPieces
                  projectId={project.id}
                  phases={project.phases}
                  pieces={project.pieces}
                  suggestions={suggestions}
                />
              </div>
            ) : value === NOTES_TAB ? (
              <ProjectNotes
                projectId={project.id}
                phases={project.phases}
                notes={notes}
                currentUser={{ id: session.userId, name: session.name }}
                now={new Date()}
              />
            ) : (
              "…"
            )}
          </TabsContent>
        ))}
      </ProjectTabs>
    </div>
  );
}
