"use client";

import { useState, type DragEvent } from "react";

import { FILES_DRAG_TYPE } from "@/constants/projectFiles";

export function useFileDrop(onFiles: (files: File[]) => void) {
  const [dragOver, setDragOver] = useState(false);

  return {
    dragOver,
    dropHandlers: {
      onDragOver: (event: DragEvent<HTMLElement>) => {
        if (event.dataTransfer.types.includes(FILES_DRAG_TYPE)) {
          event.preventDefault();
          event.stopPropagation();
          setDragOver(true);
        }
      },
      onDragLeave: (event: DragEvent<HTMLElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setDragOver(false);
        }
      },
      onDrop: (event: DragEvent<HTMLElement>) => {
        if (event.dataTransfer.files.length > 0) {
          event.preventDefault();
          event.stopPropagation();
          setDragOver(false);
          onFiles([...event.dataTransfer.files]);
        }
      },
    },
  };
}
