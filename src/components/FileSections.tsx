"use client";

import { Plus } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  addFileSection,
  recreateProjectTree,
  syncFromDropbox,
  unlinkProject,
} from "@/actions/projects";
import {
  FileSectionBlock,
  type SectionVariant,
} from "@/components/FileSectionBlock";
import { ImageLightbox } from "@/components/ImageLightbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ADD_FILE_SECTION_LABEL,
  CONFIRM_LABEL,
  DROPBOX_SYNC_STATUS,
  FOLDER_MISSING_MESSAGE,
  FOLDER_RECREATE_LABEL,
  FOLDER_UNLINK_LABEL,
  NEW_SECTION_LABEL,
  NEW_SECTION_PLACEHOLDER,
} from "@/constants/projectFiles";
import { CANCEL_LABEL } from "@/constants/projects";
import { useOpenFile } from "@/hooks/use-open-file";
import type { FileSectionRecord, SectionFile } from "@/lib/projectFiles";

type Lightbox = { images: SectionFile[]; index: number };

type FileSectionsProps = {
  projectId: string;
  pieceId: number | null;
  sections: FileSectionRecord[];
  variant: SectionVariant;
};

export function FileSections({
  projectId,
  pieceId,
  sections,
  variant,
}: FileSectionsProps) {
  const [lightbox, setLightbox] = useState<Lightbox | null>(null);
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();
  const [folderMissing, setFolderMissing] = useState(false);
  const requested = useRef(false);

  useEffect(() => {
    if (pieceId !== null || requested.current) {
      return;
    }
    requested.current = true;
    void syncFromDropbox(projectId).then(({ status }) =>
      setFolderMissing(status === DROPBOX_SYNC_STATUS.missing),
    );
  }, [pieceId, projectId]);

  const { openOriginal } = useOpenFile(projectId);

  if (folderMissing) {
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3"
      >
        <span className="font-medium">{FOLDER_MISSING_MESSAGE}</span>
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await recreateProjectTree(projectId);
              setFolderMissing(false);
            })
          }
        >
          {FOLDER_RECREATE_LABEL}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await unlinkProject(projectId);
            })
          }
        >
          {FOLDER_UNLINK_LABEL}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className={
          variant === "row"
            ? "flex flex-col gap-8"
            : "grid grid-cols-[repeat(auto-fill,minmax(var(--container-file-section),1fr))] gap-3"
        }
      >
        {sections.map((section) => (
          <FileSectionBlock
            key={section.id}
            projectId={projectId}
            section={section}
            pieceId={pieceId}
            variant={variant}
            onViewImages={(images, index) => setLightbox({ images, index })}
          />
        ))}
      </div>
      {adding ? (
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const name = new FormData(event.currentTarget)
              .get("name")
              ?.toString()
              .trim();
            if (name) {
              startTransition(async () => {
                await addFileSection(projectId, pieceId, name);
                setAdding(false);
              });
            }
          }}
        >
          <Input
            name="name"
            aria-label={NEW_SECTION_LABEL}
            placeholder={NEW_SECTION_PLACEHOLDER}
            autoFocus
            className="max-w-xs"
          />
          <Button type="submit" size="sm" disabled={pending}>
            {CONFIRM_LABEL}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAdding(false)}
          >
            {CANCEL_LABEL}
          </Button>
        </form>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit"
          onClick={() => setAdding(true)}
        >
          <Plus />
          {ADD_FILE_SECTION_LABEL}
        </Button>
      )}
      {lightbox && (
        <ImageLightbox
          projectId={projectId}
          images={lightbox.images}
          index={lightbox.index}
          onIndexChange={(index) =>
            setLightbox((current) => current && { ...current, index })
          }
          onOpenOriginal={(file) => void openOriginal(file)}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
