import { notFound } from "next/navigation";

import { getProject, getProjectNotes } from "@/actions/projects";
import { ProjectNotes } from "@/components/ProjectNotes";
import { ProjectViewTracker } from "@/components/ProjectViewTracker";
import { projectNotesPath } from "@/lib/paths";
import { requireActiveSession } from "@/lib/session";

type ProjectNotesPageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: ProjectNotesPageProps) {
  const { id } = await params;
  const session = await requireActiveSession(projectNotesPath(id));
  const [project, notes] = await Promise.all([
    getProject(id),
    getProjectNotes(id),
  ]);

  if (!project) {
    return notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 pt-6 pb-16">
      <ProjectViewTracker projectId={project.id} />
      <ProjectNotes
        projectId={project.id}
        phases={project.phases}
        notes={notes}
        currentUser={{ id: session.userId, name: session.name }}
        now={new Date()}
      />
    </div>
  );
}
