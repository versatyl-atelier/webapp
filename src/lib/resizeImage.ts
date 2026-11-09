import {
  COVER_BACKGROUND,
  COVER_CANVAS_CONTEXT,
  COVER_JPEG_MIN_QUALITY,
  COVER_JPEG_QUALITY,
  COVER_JPEG_QUALITY_STEP,
  COVER_MAX_BYTES,
  COVER_MAX_SIDE,
  COVER_MIME_TYPE,
  COVER_UNREADABLE_MESSAGE,
} from "@/constants/projectFiles";
import { fitWithin } from "@/lib/projectFiles";

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) =>
    canvas.toBlob(resolve, COVER_MIME_TYPE, quality),
  );
}

export async function resizeToJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = fitWithin(bitmap, COVER_MAX_SIDE);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext(COVER_CANVAS_CONTEXT);
  if (!context) {
    throw new Error(COVER_UNREADABLE_MESSAGE);
  }
  context.fillStyle = COVER_BACKGROUND;
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  for (
    let quality = COVER_JPEG_QUALITY;
    quality >= COVER_JPEG_MIN_QUALITY;
    quality -= COVER_JPEG_QUALITY_STEP
  ) {
    const blob = await canvasToBlob(canvas, quality);
    if (blob && blob.size <= COVER_MAX_BYTES) {
      return blob;
    }
  }
  throw new Error(COVER_UNREADABLE_MESSAGE);
}
