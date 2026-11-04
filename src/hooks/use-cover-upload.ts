"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import { saveCoverImage } from "@/actions/projects";
import {
  COVER_IMAGE_FIELD,
  COVER_PIECE_FIELD,
  COVER_NEEDS_SAVE_MESSAGE,
  COVER_UNREADABLE_MESSAGE,
} from "@/constants/projectFiles";
import { SAVED_TOAST_OPTIONS } from "@/constants/projects";
import { isCoverFile } from "@/lib/projectFiles";
import { resizeToJpeg } from "@/lib/resizeImage";

export function useCoverUpload(pieceId: number | null) {
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (files: File[]) => {
      const file = files.find(isCoverFile);
      if (!file) {
        return;
      }
      if (pieceId === null) {
        toast.error(COVER_NEEDS_SAVE_MESSAGE);
        return;
      }
      setUploading(true);
      try {
        const image = await resizeToJpeg(file);
        const formData = new FormData();
        formData.set(COVER_PIECE_FIELD, String(pieceId));
        formData.set(COVER_IMAGE_FIELD, image, file.name);
        const state = await saveCoverImage(undefined, formData);
        const error =
          state?.errors?.image?.[0] ?? state?.errors?.dataValidation;
        if (error) {
          toast.error(error);
        } else if (state?.message) {
          toast.success(state.message, SAVED_TOAST_OPTIONS);
        }
      } catch {
        toast.error(COVER_UNREADABLE_MESSAGE);
      }
      setUploading(false);
    },
    [pieceId],
  );

  return { upload, uploading };
}
