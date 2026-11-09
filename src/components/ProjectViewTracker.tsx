"use client";

import { useEffect } from "react";

import { recordProjectView } from "@/actions/projects";

type ProjectViewTrackerProps = {
  projectId: string;
};

export function ProjectViewTracker({ projectId }: ProjectViewTrackerProps) {
  useEffect(() => {
    void recordProjectView(projectId);
  }, [projectId]);

  return null;
}
