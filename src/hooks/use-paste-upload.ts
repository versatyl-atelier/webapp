"use client";

import { useEffect, useRef } from "react";

import { pastedFileName } from "@/lib/projectFiles";

import { PASTE_EVENT, TEXT_MIME_TYPE } from "@/constants/projectFiles";

let hoveredTarget: symbol | null = null;

function isTyping(): boolean {
  const active = document.activeElement;
  return (
    active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement
  );
}

function pastedFiles(event: ClipboardEvent): File[] {
  const items = [...(event.clipboardData?.items ?? [])];
  if (isTyping() && items.some((item) => item.type === TEXT_MIME_TYPE)) {
    return [];
  }
  return [...(event.clipboardData?.files ?? [])].map(
    (file, index) =>
      new File([file], pastedFileName(file, index, new Date()), {
        type: file.type,
      }),
  );
}

type PasteUploadOptions = { fallback?: boolean };

export function usePasteUpload(
  onFiles: (files: File[]) => void,
  { fallback = false }: PasteUploadOptions = {},
) {
  const id = useRef(Symbol("paste-target"));
  const handler = useRef(onFiles);

  useEffect(() => {
    handler.current = onFiles;
  }, [onFiles]);

  useEffect(() => {
    const self = id.current;
    const onPaste = (event: ClipboardEvent) => {
      if (hoveredTarget !== self && !(fallback && hoveredTarget === null)) {
        return;
      }
      const files = pastedFiles(event);
      if (files.length > 0) {
        event.preventDefault();
        handler.current(files);
      }
    };
    document.addEventListener(PASTE_EVENT, onPaste);
    return () => {
      document.removeEventListener(PASTE_EVENT, onPaste);
      if (hoveredTarget === self) {
        hoveredTarget = null;
      }
    };
  }, [fallback]);

  return {
    onPointerEnter: () => {
      hoveredTarget = id.current;
    },
    onPointerLeave: () => {
      if (hoveredTarget === id.current) {
        hoveredTarget = null;
      }
    },
  };
}
