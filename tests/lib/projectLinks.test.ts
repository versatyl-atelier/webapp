import { describe, expect, it } from "vitest";

import { ProjectType } from "@/generated/prisma/enums";
import {
  projectLinkIds,
  projectLinkItem,
  projectLinkSource,
} from "@/lib/projectLinks";

describe("projectLinkIds", () => {
  it("fills only the column of the item type", () => {
    expect(projectLinkIds({ type: ProjectType.trello, id: "abc" })).toEqual({
      projectType: ProjectType.trello,
      projectId: "abc",
      taskId: null,
      jobineId: null,
    });
    expect(projectLinkIds({ type: ProjectType.task, id: "3" })).toEqual({
      projectType: ProjectType.task,
      projectId: null,
      taskId: 3,
      jobineId: null,
    });
    expect(projectLinkIds({ type: ProjectType.jobine, id: 7 })).toEqual({
      projectType: ProjectType.jobine,
      projectId: null,
      taskId: null,
      jobineId: 7,
    });
  });
});

describe("projectLinkItem", () => {
  it("round-trips with projectLinkIds", () => {
    for (const item of [
      { type: ProjectType.trello, id: "abc" },
      { type: ProjectType.task, id: 3 },
      { type: ProjectType.jobine, id: 7 },
    ]) {
      expect(projectLinkItem(projectLinkIds(item))).toEqual(item);
    }
  });

  it("is null when the linked item was removed", () => {
    expect(
      projectLinkItem({
        projectType: ProjectType.jobine,
        projectId: null,
        taskId: null,
        jobineId: null,
      }),
    ).toBeNull();
  });
});

describe("projectLinkSource", () => {
  const sources = {
    project: { name: "Projet" },
    task: { name: "Tâche" },
    jobine: { name: "Jobine" },
  };

  it("picks the relation matching the link type", () => {
    expect(
      projectLinkSource({ projectType: ProjectType.trello, ...sources }),
    ).toBe(sources.project);
    expect(
      projectLinkSource({ projectType: ProjectType.task, ...sources }),
    ).toBe(sources.task);
    expect(
      projectLinkSource({ projectType: ProjectType.jobine, ...sources }),
    ).toBe(sources.jobine);
  });
});
