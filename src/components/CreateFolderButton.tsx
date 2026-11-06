"use client";

import { FolderPlus } from "lucide-react";
import { useTransition } from "react";

import { createProjectFolder } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import { FOLDER_CREATE_LABEL } from "@/constants/projectFiles";

type CreateFolderButtonProps = { projectId: string };

export function CreateFolderButton({ projectId }: CreateFolderButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-fit"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await createProjectFolder(projectId);
        })
      }
    >
      <FolderPlus />
      {FOLDER_CREATE_LABEL}
    </Button>
  );
}
