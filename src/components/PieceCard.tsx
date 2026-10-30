"use client";

import { GripVertical, ImageIcon, StickyNote } from "lucide-react";
import { useState } from "react";

import {
  NO_PIECE_DETAILS_LABEL,
  DRAG_PIECE_LABEL,
  PIECE_DRAG_TYPE,
  PIECE_NOTES_LABEL,
  UNNAMED_PIECE_LABEL,
} from "@/constants/projects";
import { pieceReadFields, type PieceRecord } from "@/lib/projects";
import { cn } from "@/lib/utils";

type PieceCardProps = {
  piece: PieceRecord;
  draggable: boolean;
  onOpen: () => void;
};

export function PieceCard({ piece, draggable, onOpen }: PieceCardProps) {
  const [dragging, setDragging] = useState(false);
  const fields = pieceReadFields(piece);
  const title = piece.type || UNNAMED_PIECE_LABEL;

  return (
    <li
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData(PIECE_DRAG_TYPE, String(piece.id));
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      className={cn(
        "bg-card focus-within:ring-ring/50 relative flex flex-col overflow-hidden rounded-xl border shadow-xs transition-shadow focus-within:ring-3 hover:shadow-md",
        dragging && "opacity-40",
      )}
    >
      <div className="bg-muted text-muted-foreground flex aspect-video items-center justify-center border-b">
        <ImageIcon aria-hidden className="size-7" />
        {draggable && (
          <span
            title={DRAG_PIECE_LABEL}
            className="absolute top-2 left-2 cursor-grab"
          >
            <GripVertical aria-hidden className="size-4" />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <h3 className="font-semibold">
          <button
            type="button"
            onClick={onOpen}
            className="text-left outline-none after:absolute after:inset-0"
          >
            {title}
          </button>
        </h3>
        {piece.description && (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {piece.description}
          </p>
        )}
        {fields.length === 0 && !piece.description ? (
          <p className="text-muted-foreground text-sm italic">
            {NO_PIECE_DETAILS_LABEL}
          </p>
        ) : (
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 text-xs">
            {fields.map(({ label, value }) => (
              <div key={label} className="col-span-2 grid grid-cols-subgrid">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="truncate" title={value}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {piece.noteCount > 0 && (
          <p className="text-muted-foreground mt-auto flex items-center gap-1 pt-1 text-xs">
            <StickyNote aria-hidden className="size-3" />
            <span>
              {piece.noteCount} {PIECE_NOTES_LABEL.toLowerCase()}
            </span>
          </p>
        )}
      </div>
    </li>
  );
}
