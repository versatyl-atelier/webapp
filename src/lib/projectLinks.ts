import type { TimeEntryProject } from "@/generated/prisma/client";
import { ProjectType } from "@/generated/prisma/enums";

export type ProjectOrTask = {
  id: string | number;
  type: ProjectType;
};

export type ProjectLinkIds = Pick<
  TimeEntryProject,
  "projectType" | "projectId" | "taskId" | "jobineId"
>;

export type ProjectLinkSources<T> = {
  projectType: ProjectType;
  project: T | null;
  task: T | null;
  jobine: T | null;
};

function intIdOf(type: ProjectType, expected: ProjectType, id: string) {
  return type === expected ? parseInt(id, 10) : null;
}

export function projectLinkIds({ type, id }: ProjectOrTask): ProjectLinkIds {
  const strId = String(id);
  return {
    projectType: type,
    projectId: type === ProjectType.trello ? strId : null,
    taskId: intIdOf(type, ProjectType.task, strId),
    jobineId: intIdOf(type, ProjectType.jobine, strId),
  };
}

export function projectLinkItem({
  projectType,
  projectId,
  taskId,
  jobineId,
}: ProjectLinkIds): ProjectOrTask | null {
  const ids: Record<ProjectType, string | number | null> = {
    trello: projectId,
    task: taskId,
    jobine: jobineId,
  };
  const id = ids[projectType];
  return id === null ? null : { type: projectType, id };
}

export function projectLinkSource<T>({
  projectType,
  project,
  task,
  jobine,
}: ProjectLinkSources<T>): T | null {
  const sources: Record<ProjectType, T | null> = {
    trello: project,
    task,
    jobine,
  };
  return sources[projectType];
}
