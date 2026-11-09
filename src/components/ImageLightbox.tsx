"use client";

import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { FILE_THUMBNAIL_PREVIEW_SIZE } from "@/constants/dropbox";
import { ARROW_LEFT_KEY, ARROW_RIGHT_KEY } from "@/constants/keys";
import {
  COUNT_SEPARATOR,
  INDEX_SEPARATOR,
  LIGHTBOX_LABEL,
  LIGHTBOX_NEXT_LABEL,
  LIGHTBOX_OPEN_ORIGINAL_LABEL,
  LIGHTBOX_PREVIOUS_LABEL,
} from "@/constants/projectFiles";
import { fileThumbnailUrl, type SectionFile } from "@/lib/projectFiles";

type ImageLightboxProps = {
  projectId: string;
  images: SectionFile[];
  index: number;
  onIndexChange: (index: number) => void;
  onOpenOriginal: (file: SectionFile) => void;
  onClose: () => void;
};

export function ImageLightbox({
  projectId,
  images,
  index,
  onIndexChange,
  onOpenOriginal,
  onClose,
}: ImageLightboxProps) {
  const image = images[index];
  const step = (offset: number) =>
    onIndexChange((index + offset + images.length) % images.length);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === ARROW_LEFT_KEY) {
        step(-1);
      } else if (event.key === ARROW_RIGHT_KEY) {
        step(1);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  if (!image) {
    return null;
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-11/12 flex-col items-center gap-3 sm:max-w-5xl">
        <DialogTitle className="sr-only">{LIGHTBOX_LABEL}</DialogTitle>
        <DialogDescription className="sr-only">{image.name}</DialogDescription>
        <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
          <img
            src={fileThumbnailUrl(
              projectId,
              image,
              FILE_THUMBNAIL_PREVIEW_SIZE,
            )}
            alt={image.name}
            className="max-h-[75dvh] max-w-full rounded-md object-contain"
          />
          {images.length > 1 && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                aria-label={LIGHTBOX_PREVIOUS_LABEL}
                onClick={() => step(-1)}
                className="absolute top-1/2 left-1 -translate-y-1/2"
              >
                <ChevronLeft />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                aria-label={LIGHTBOX_NEXT_LABEL}
                onClick={() => step(1)}
                className="absolute top-1/2 right-1 -translate-y-1/2"
              >
                <ChevronRight />
              </Button>
            </>
          )}
        </div>
        <div className="flex w-full items-center justify-between gap-3 text-sm">
          <p className="text-muted-foreground min-w-0 truncate">
            {image.name}
            {images.length > 1 &&
              `${COUNT_SEPARATOR}${index + 1}${INDEX_SEPARATOR}${images.length}`}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenOriginal(image)}
          >
            <ExternalLink />
            {LIGHTBOX_OPEN_ORIGINAL_LABEL}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
