"use client";

import { useCallback } from "react";
import { toast } from "sonner";

import { getFileLink } from "@/actions/projects";
import { NEW_TAB_TARGET, OPEN_FAILED_MESSAGE } from "@/constants/projectFiles";
import type { SectionFile } from "@/lib/projectFiles";

export function useOpenFile(projectId: string) {
  const openOriginal = useCallback(
    async (file: Pick<SectionFile, "id">) => {
      const tab = window.open("", NEW_TAB_TARGET);
      try {
        const link = await getFileLink(projectId, file.id);
        if (tab) {
          tab.opener = null;
          tab.location.href = link;
        }
      } catch {
        tab?.close();
        toast.error(OPEN_FAILED_MESSAGE);
      }
    },
    [projectId],
  );

  return { openOriginal };
}
