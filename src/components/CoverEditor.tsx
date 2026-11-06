"use client";

import { ImageIcon, Trash2, Upload } from "lucide-react";
import { useId, useRef, useState, useTransition } from "react";

import { clearPieceCover, setCoverFraming } from "@/actions/projects";
import { CoverImage } from "@/components/CoverImage";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  ARROW_DOWN_KEY,
  ARROW_LEFT_KEY,
  ARROW_RIGHT_KEY,
  ARROW_UP_KEY,
} from "@/constants/keys";
import {
  COVER_ACCEPT,
  COVER_ADD_LABEL,
  COVER_FRAMING_LABEL,
  COVER_HINT_APPLE,
  COVER_HINT_DEFAULT,
  COVER_LABEL,
  COVER_PAN_STEP,
  COVER_REMOVE_LABEL,
  COVER_REPLACE_LABEL,
  COVER_ZOOM_LABEL,
  COVER_ZOOM_MAX,
  COVER_ZOOM_MIN,
  COVER_ZOOM_STEP,
  UPLOADING_LABEL,
} from "@/constants/projectFiles";
import { useIsApplePlatform } from "@/hooks/use-apple-platform";
import {
  DEFAULT_COVER_FRAMING,
  nudgeFraming,
  panFraming,
  type CoverFraming,
} from "@/lib/projectFiles";
import type { PieceRecord } from "@/lib/projects";
import { cn } from "@/lib/utils";

const NUDGES: Record<string, { x: number; y: number }> = {
  [ARROW_LEFT_KEY]: { x: -COVER_PAN_STEP, y: 0 },
  [ARROW_RIGHT_KEY]: { x: COVER_PAN_STEP, y: 0 },
  [ARROW_UP_KEY]: { x: 0, y: -COVER_PAN_STEP },
  [ARROW_DOWN_KEY]: { x: 0, y: COVER_PAN_STEP },
};

type Drag = { pointerX: number; pointerY: number; origin: CoverFraming };

type CoverEditorProps = {
  projectId: string;
  piece: PieceRecord;
  uploading: boolean;
  dragOver: boolean;
  onUpload: (files: File[]) => void;
};

export function CoverEditor({
  projectId,
  piece,
  uploading,
  dragOver,
  onUpload,
}: CoverEditorProps) {
  const hintId = useId();
  const input = useRef<HTMLInputElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [framing, setFraming] = useState<CoverFraming>({
    x: piece.coverX,
    y: piece.coverY,
    zoom: piece.coverZoom,
  });
  const [, startTransition] = useTransition();
  const hint = useIsApplePlatform() ? COVER_HINT_APPLE : COVER_HINT_DEFAULT;
  const hasCover = piece.coverUpdatedAt !== null;

  const persist = (next: CoverFraming) =>
    startTransition(() => setCoverFraming(piece.id, next));

  return (
    <section aria-label={COVER_LABEL} className="flex flex-col gap-2">
      <div
        ref={frame}
        role="group"
        tabIndex={hasCover ? 0 : -1}
        aria-label={COVER_FRAMING_LABEL}
        aria-describedby={hintId}
        onPointerDown={(event) => {
          if (!hasCover) {
            return;
          }
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = {
            pointerX: event.clientX,
            pointerY: event.clientY,
            origin: framing,
          };
        }}
        onPointerMove={(event) => {
          const start = drag.current;
          const rect = frame.current?.getBoundingClientRect();
          if (start && rect) {
            setFraming(
              panFraming(
                start.origin,
                {
                  x: event.clientX - start.pointerX,
                  y: event.clientY - start.pointerY,
                },
                rect,
              ),
            );
          }
        }}
        onPointerUp={() => {
          if (drag.current) {
            drag.current = null;
            persist(framing);
          }
        }}
        onKeyDown={(event) => {
          const step = NUDGES[event.key];
          if (hasCover && step) {
            event.preventDefault();
            setFraming((current) => nudgeFraming(current, step));
          }
        }}
        onKeyUp={(event) => {
          if (hasCover && NUDGES[event.key]) {
            persist(framing);
          }
        }}
        onDoubleClick={() => {
          setFraming(DEFAULT_COVER_FRAMING);
          persist(DEFAULT_COVER_FRAMING);
        }}
        className={cn(
          "bg-muted text-muted-foreground focus-visible:ring-ring/50 relative flex aspect-video touch-none items-center justify-center overflow-hidden rounded-lg border outline-hidden focus-visible:ring-3",
          hasCover && "cursor-grab active:cursor-grabbing",
          dragOver && "border-primary border-2 border-dashed",
        )}
      >
        {piece.coverUpdatedAt ? (
          <CoverImage
            projectId={projectId}
            pieceId={piece.id}
            version={piece.coverUpdatedAt}
            framing={framing}
          />
        ) : (
          <ImageIcon aria-hidden className="size-8" />
        )}
        {uploading && (
          <p className="bg-background/80 absolute inset-0 flex animate-pulse items-center justify-center text-sm motion-reduce:animate-none">
            {UPLOADING_LABEL}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => input.current?.click()}
        >
          <Upload />
          {hasCover ? COVER_REPLACE_LABEL : COVER_ADD_LABEL}
        </Button>
        {hasCover && (
          <>
            <div className="text-muted-foreground flex flex-1 items-center gap-2 text-xs">
              <span aria-hidden>{COVER_ZOOM_LABEL}</span>
              <Slider
                value={[framing.zoom]}
                min={COVER_ZOOM_MIN}
                max={COVER_ZOOM_MAX}
                step={COVER_ZOOM_STEP}
                thumbLabel={COVER_ZOOM_LABEL}
                onValueChange={(next) =>
                  setFraming({
                    ...framing,
                    zoom: [next].flat()[0] ?? framing.zoom,
                  })
                }
                onValueCommitted={(next) =>
                  persist({
                    ...framing,
                    zoom: [next].flat()[0] ?? framing.zoom,
                  })
                }
                className="min-w-24 flex-1"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => startTransition(() => clearPieceCover(piece.id))}
            >
              <Trash2 />
              {COVER_REMOVE_LABEL}
            </Button>
          </>
        )}
      </div>
      <p id={hintId} className="text-muted-foreground text-xs">
        {hint}
      </p>
      <input
        ref={input}
        type="file"
        accept={COVER_ACCEPT}
        hidden
        onChange={(event) => {
          const picked = [...(event.target.files ?? [])];
          event.target.value = "";
          onUpload(picked);
        }}
      />
    </section>
  );
}
