import { ArrowRight } from "lucide-react";
import Link from "next/link";
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
import { RowTitle } from "@/components/RowTitle";
import {
  NOTES_EMOJI,
  NOTES_HEADING,
  NOTES_LINK_LABEL,
} from "@/constants/projects";
import { projectNotesPath, projectPath } from "@/lib/paths";
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
        project={{ color: project.color, address: project.address }}
        contacts={project.contacts}
        suggestions={suggestions}
      />
      <section
        aria-labelledby="project-notes"
        className="flex flex-col gap-2.5"
      >
        <RowTitle id="project-notes" className="min-h-7 content-center">
          {NOTES_HEADING}
        </RowTitle>
        <Link
          href={projectNotesPath(project.id)}
          className="group bg-card hover:border-input focus-visible:ring-ring/50 inline-flex w-fit items-center gap-2.5 rounded-xl border px-4 py-3 font-medium shadow-xs outline-hidden transition-shadow hover:shadow-md focus-visible:ring-3"
        >
          <span aria-hidden className="text-lg">
            {NOTES_EMOJI}
          </span>
          {NOTES_LINK_LABEL}
          <ArrowRight
            aria-hidden
            className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
          />
        </Link>
      </section>
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
