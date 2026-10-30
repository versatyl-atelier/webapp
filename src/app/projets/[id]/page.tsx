import { ArrowRight, StickyNote } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getFicheSuggestions,
  getProject,
  isProjectPinned,
} from "@/actions/projects";
import { ProjectContacts } from "@/components/ProjectContacts";
import { ProjectHeader } from "@/components/ProjectHeader";
import { ProjectPieces } from "@/components/ProjectPieces";
import { ProjectViewTracker } from "@/components/ProjectViewTracker";
import { NOTES_LINK_LABEL } from "@/constants/projects";
import { projectNotesPath, projectPath } from "@/lib/paths";
import { requireActiveSession } from "@/lib/session";

type ProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: ProjectPageProps) {
  const { id } = await params;
  await requireActiveSession(projectPath(id));
  const [project, suggestions, pinned] = await Promise.all([
    getProject(id),
    getFicheSuggestions(),
    isProjectPinned(id),
  ]);

  if (!project) {
    return notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pt-6 pb-16">
      <ProjectViewTracker projectId={project.id} />
      <ProjectHeader project={project} pinned={pinned} />
      <ProjectPieces
        projectId={project.id}
        phases={project.phases}
        pieces={project.pieces}
        suggestions={suggestions}
      />
      <ProjectContacts
        projectId={project.id}
        contacts={project.contacts}
        suggestions={suggestions}
      />
      <Link
        href={projectNotesPath(project.id)}
        className="bg-card hover:bg-muted focus-visible:ring-ring/50 flex w-fit items-center gap-2.5 rounded-xl border px-4 py-3 font-medium shadow-xs transition-colors outline-none focus-visible:ring-3"
      >
        <StickyNote aria-hidden className="text-muted-foreground size-4" />
        {NOTES_LINK_LABEL}
        <ArrowRight aria-hidden className="text-muted-foreground size-4" />
      </Link>
    </div>
  );
}
