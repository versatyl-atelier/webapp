"use client";

import { Folder, MoreHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FILE_THUMBNAIL_TILE_SIZE } from "@/constants/dropbox";
import {
  FILE_OPTIONS_LABEL,
  OPEN_FILE_LABEL,
  REMOVE_FILE_LABEL,
} from "@/constants/projectFiles";
import { fileExtension } from "@/lib/dropbox";
import {
  fileThumbnailUrl,
  formatFileSize,
  type SectionFile,
} from "@/lib/projectFiles";
import { cn } from "@/lib/utils";

export type TileSize = "sm" | "lg";

type FileTileProps = {
  projectId: string;
  file: SectionFile;
  size: TileSize;
  onOpen: () => void;
  onRemove: () => void;
};

export function FileTile({
  projectId,
  file,
  size,
  onOpen,
  onRemove,
}: FileTileProps) {
  const large = size === "lg";
  const hideName = large && file.isImage;

  return (
    <li
      className={cn(
        "group bg-card focus-within:ring-ring/50 hover:border-input relative flex min-w-0 flex-col overflow-hidden border transition-[border-color,box-shadow] focus-within:ring-3",
        large ? "rounded-xl shadow-xs" : "rounded-lg",
      )}
    >
      <div className="bg-muted text-muted-foreground flex aspect-4/3 items-center justify-center overflow-hidden">
        {file.isFolder ? (
          <Folder aria-hidden className={large ? "size-9" : "size-7"} />
        ) : file.hasThumbnail ? (
          <img
            src={fileThumbnailUrl(projectId, file, FILE_THUMBNAIL_TILE_SIZE)}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <Badge
            variant="secondary"
            className="text-2xs rounded-md px-2 font-bold tracking-wider uppercase"
          >
            {fileExtension(file.name) || "?"}
          </Badge>
        )}
      </div>
      <div className={cn("min-w-0", hideName ? "p-0" : "px-2 py-1.5")}>
        <button
          type="button"
          onClick={onOpen}
          title={file.name}
          className={cn(
            "block w-full truncate text-left outline-hidden after:absolute after:inset-0",
            large ? "text-xs" : "text-2xs",
            hideName && "sr-only",
            !hideName && "text-muted-foreground",
          )}
        >
          {file.name}
        </button>
        {!hideName && !file.isFolder && file.size !== null && (
          <p className="text-muted-foreground text-2xs">
            {formatFileSize(file.size)}
          </p>
        )}
      </div>
      {!file.isFolder && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="secondary"
                size="icon-xs"
                aria-label={`${FILE_OPTIONS_LABEL} : ${file.name}`}
                className="absolute top-1.5 right-1.5 z-10 bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80 hover:text-white focus-visible:opacity-100 data-popup-open:opacity-100"
              />
            }
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onOpen}>
              {OPEN_FILE_LABEL}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onRemove}>
              {REMOVE_FILE_LABEL}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  );
}
