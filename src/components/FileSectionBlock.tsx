"use client";

import { ArrowLeft, ArrowRight, Plus, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from "react";
import { toast } from "sonner";

import {
  createUpload,
  deleteFile,
  deleteFileSection,
  finalizeUpload,
  listSectionFiles,
  renameFileSection,
  restoreFile,
  restoreFileSection,
} from "@/actions/projects";
import { FileTile, type TileSize } from "@/components/FileTile";
import { ROW_TITLE_CLASS } from "@/components/RowTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PIECE_SECTION_NAMES } from "@/constants/dropbox";
import {
  ADD_FILES_LABEL,
  BACK_LABEL,
  COMING_SOON_LABEL,
  DROP_FILES_LABEL,
  FILE_REMOVED_SUFFIX,
  LISTS_LINK_LABEL,
  LIST_FAILED_MESSAGE,
  INDEX_SEPARATOR,
  LOADING_SECTION_LABEL,
  MESSAGE_SEPARATOR,
  REMOVE_SECTION_LABEL,
  SECTION_NAME_LABEL,
  SECTION_PATH_SEPARATOR,
  SECTION_REMOVED_SUFFIX,
  UPLOADING_LABEL,
  UPLOAD_FAILED_MESSAGE,
} from "@/constants/projectFiles";
import { SAVED_TOAST_OPTIONS } from "@/constants/projects";
import { ENTER_KEY } from "@/constants/keys";
import { useFileDrop } from "@/hooks/use-file-drop";
import { useOpenFile } from "@/hooks/use-open-file";
import { usePasteUpload } from "@/hooks/use-paste-upload";
import type { FileSectionRecord, SectionFile } from "@/lib/projectFiles";
import { postFileToLink } from "@/lib/uploadFile";
import { cn } from "@/lib/utils";
import { undoToast } from "@/lib/undoToast";

export type SectionVariant = "row" | "box";

const DEBIT_SECTION_NAME = PIECE_SECTION_NAMES[7];

type FileSectionBlockProps = {
  projectId: string;
  section: FileSectionRecord;
  pieceId: number | null;
  variant: SectionVariant;
  onViewImages: (images: SectionFile[], index: number) => void;
};

export function FileSectionBlock({
  projectId,
  section,
  pieceId,
  variant,
  onViewImages,
}: FileSectionBlockProps) {
  const headingId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [subpath, setSubpath] = useState<string[]>([]);
  const [files, setFiles] = useState<SectionFile[] | null>(null);
  const [uploading, setUploading] = useState(0);
  const [, startTransition] = useTransition();
  const path = subpath.join(SECTION_PATH_SEPARATOR);

  const load = useCallback(async () => {
    try {
      setFiles(await listSectionFiles(section.id, path));
    } catch {
      setFiles([]);
      toast.error(LIST_FAILED_MESSAGE);
    }
  }, [section.id, path]);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = async (picked: File[]) => {
    setUploading((count) => count + picked.length);
    for (const file of picked) {
      try {
        const created = await createUpload(
          section.id,
          path,
          file.name,
          file.size,
        );
        if (created.errors) {
          toast.error(
            `${file.name}${MESSAGE_SEPARATOR}${created.errors.dataValidation}`,
          );
        } else {
          await postFileToLink(created.link, file);
          await finalizeUpload(section.id, path, created.name);
        }
      } catch {
        toast.error(`${UPLOAD_FAILED_MESSAGE}${MESSAGE_SEPARATOR}${file.name}`);
      }
      setUploading((count) => count - 1);
    }
    await load();
  };

  const pasteHandlers = usePasteUpload((pasted) => void upload(pasted));
  const { dragOver, dropHandlers } = useFileDrop(
    (dropped) => void upload(dropped),
  );

  const { openOriginal } = useOpenFile(projectId);

  const open = (file: SectionFile) => {
    if (file.isFolder) {
      setSubpath((current) => [...current, file.name]);
      return;
    }
    if (file.isImage) {
      const images = (files ?? []).filter(({ isImage }) => isImage);
      onViewImages(
        images,
        images.findIndex(({ id }) => id === file.id),
      );
      return;
    }
    void openOriginal(file);
  };

  const remove = (file: SectionFile) =>
    startTransition(async () => {
      const deleted = await deleteFile(projectId, file.id);
      await load();
      undoToast(`${file.name} ${FILE_REMOVED_SUFFIX}`, () =>
        startTransition(async () => {
          await restoreFile(projectId, deleted.path, deleted.rev);
          await load();
        }),
      );
    });

  const removeSection = () =>
    startTransition(async () => {
      await deleteFileSection(section.id);
      undoToast(`${section.name} ${SECTION_REMOVED_SUFFIX}`, () =>
        startTransition(() => restoreFileSection(section.id)),
      );
    });

  const isRow = variant === "row";
  const Heading = isRow ? "h2" : "h3";
  const tileSize: TileSize = isRow ? "lg" : "sm";
  const isEmpty = files !== null && files.length === 0 && uploading === 0;

  const commitRename = (input: HTMLInputElement) => {
    const name = input.value.trim();
    if (!name) {
      input.value = section.name;
    } else if (name !== section.name) {
      startTransition(() => renameFileSection(section.id, name));
    }
  };

  const title = section.isCustom ? (
    <Input
      id={headingId}
      aria-label={SECTION_NAME_LABEL}
      defaultValue={section.name}
      onBlur={(event) => commitRename(event.currentTarget)}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === ENTER_KEY) {
          event.currentTarget.blur();
        }
      }}
      className={cn(
        "hover:border-input focus-visible:bg-card h-7 w-64 max-w-full border-transparent bg-transparent px-2 shadow-none dark:bg-transparent",
        isRow ? ROW_TITLE_CLASS : "text-xs font-semibold",
        "md:text-xs",
      )}
    />
  ) : (
    <Heading
      id={headingId}
      className={cn(
        "truncate",
        isRow ? ROW_TITLE_CLASS : "text-xs font-semibold",
      )}
    >
      {section.name}
    </Heading>
  );

  return (
    <section
      aria-labelledby={headingId}
      {...pasteHandlers}
      {...dropHandlers}
      className={cn(
        "flex flex-col gap-2.5 rounded-xl transition-[background-color,box-shadow]",
        !isRow && "bg-background/60 border p-2.5",
        dragOver && "bg-primary/5 ring-primary ring-2",
      )}
    >
      <div className="group flex min-h-7 items-center gap-1.5">
        {subpath.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={BACK_LABEL}
            onClick={() => setSubpath((current) => current.slice(0, -1))}
          >
            <ArrowLeft />
          </Button>
        )}
        {title}
        {subpath.length > 0 && (
          <span className="text-muted-foreground truncate text-xs">
            {subpath.join(INDEX_SEPARATOR)}
          </span>
        )}
        {files && files.length > 0 && (
          <span className="text-muted-foreground text-xs">{files.length}</span>
        )}
        {!isRow && !section.isCustom && section.name === DEBIT_SECTION_NAME && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled
            title={COMING_SOON_LABEL}
            className="text-primary bg-primary/10 ml-auto"
          >
            {LISTS_LINK_LABEL}
            <ArrowRight aria-hidden />
          </Button>
        )}
        {section.isCustom && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`${REMOVE_SECTION_LABEL}${MESSAGE_SEPARATOR}${section.name}`}
            onClick={removeSection}
            className="ml-auto opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          >
            <X />
          </Button>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {uploading > 0 && UPLOADING_LABEL}
      </p>
      {files === null ? (
        <p className="text-muted-foreground text-xs italic">
          {LOADING_SECTION_LABEL}
        </p>
      ) : (
        <ul
          className={cn(
            "grid",
            isRow
              ? "grid-cols-[repeat(auto-fill,minmax(var(--container-file-tile),1fr))] gap-3"
              : isEmpty
                ? "grid-cols-1 gap-2"
                : "grid-cols-[repeat(auto-fill,minmax(var(--container-file-tile-sm),1fr))] gap-2",
          )}
        >
          {files.map((file) => (
            <FileTile
              key={file.id}
              projectId={projectId}
              file={file}
              size={tileSize}
              onOpen={() => open(file)}
              onRemove={() => remove(file)}
            />
          ))}
          {uploading > 0 && (
            <li className="text-muted-foreground flex aspect-4/3 animate-pulse items-center justify-center rounded-lg border border-dashed text-xs motion-reduce:animate-none">
              {UPLOADING_LABEL}
            </li>
          )}
          <li className="flex">
            <button
              type="button"
              aria-label={`${ADD_FILES_LABEL}${MESSAGE_SEPARATOR}${section.name}`}
              onClick={() => input.current?.click()}
              className={cn(
                "border-input text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring/50 flex w-full items-center justify-center border-2 border-dashed outline-hidden transition-colors focus-visible:ring-3",
                isRow ? "aspect-4/3 rounded-xl" : "min-h-15 flex-1 rounded-lg",
              )}
            >
              {dragOver ? (
                <span className="text-xs">{DROP_FILES_LABEL}</span>
              ) : (
                <Plus aria-hidden className="size-4" />
              )}
            </button>
          </li>
        </ul>
      )}
      <input
        ref={input}
        type="file"
        multiple
        hidden
        onChange={(event) => {
          const picked = [...(event.target.files ?? [])];
          event.target.value = "";
          if (picked.length > 0) {
            void upload(picked);
          }
        }}
      />
    </section>
  );
}
