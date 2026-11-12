import { notFound } from "next/navigation";

import {
  getFicheSuggestions,
  getProject,
  getProjectTrello,
  isProjectPinned,
} from "@/actions/projects";
import { CreateFolderButton } from "@/components/CreateFolderButton";
import { ProjectContacts } from "@/components/ProjectContacts";
import { ProjectFilesSection } from "@/components/ProjectFilesSection";
import { ProjectHeader } from "@/components/ProjectHeader";
import { ProjectPieces } from "@/components/ProjectPieces";
import { ProjectTrello } from "@/components/ProjectTrello";
import { ProjectViewTracker } from "@/components/ProjectViewTracker";
import { projectPath } from "@/lib/paths";
import { requireActiveSession } from "@/lib/session";

type ProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: ProjectPageProps) {
  const { id } = await params;
  await requireActiveSession(projectPath(id));
  const [project, suggestions, pinned, trello] = await Promise.all([
    getProject(id),
    getFicheSuggestions(),
    isProjectPinned(id),
    getProjectTrello(id),
  ]);

  if (!project) {
    return notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 pt-4 pb-16">
      <ProjectViewTracker projectId={project.id} />
      <ProjectHeader project={project} pinned={pinned} />
      <ProjectPieces
        projectId={project.id}
        phases={project.phases}
        pieces={project.pieces}
        fileSections={project.fileSections}
        suggestions={suggestions}
      />
      <ProjectContacts
        projectId={project.id}
        project={{ address: project.address }}
        contacts={project.contacts}
        suggestions={suggestions}
      />
      <ProjectTrello
        projectId={project.id}
        keys={trello.keys}
        pieceCount={trello.pieceCount}
        lost={trello.lost}
      />
      {project.dropboxLinked ? (
        <ProjectFilesSection
          projectId={project.id}
          sections={project.fileSections.filter(
            ({ pieceId }) => pieceId === null,
          )}
        />
      ) : (
        project.isManual && <CreateFolderButton projectId={project.id} />
      )}
    </div>
  );
}
