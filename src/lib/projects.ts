import { ProjectType } from "@/generated/prisma/enums";
import { parseItemKey } from "@/lib/itemKey";

export function projectIdsToProjectData(projectIds: string[]) {
  return projectIds.map((projectId) => {
    const { type, id } = parseItemKey(projectId);
    const strId = id.toString();
    const isProject = type === ProjectType.trello;
    return {
      projectId: isProject ? strId : null,
      taskId: isProject ? null : parseInt(strId, 10),
      projectType: isProject ? ProjectType.trello : ProjectType.task,
    };
  });
}
