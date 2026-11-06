"use client";

import { Plus, X } from "lucide-react";
import { useId, useOptimistic, useState, useTransition } from "react";

import {
  addPhase,
  deletePhase,
  movePiece,
  renamePhase,
} from "@/actions/projects";
import { PieceCard } from "@/components/PieceCard";
import { PieceDialog } from "@/components/PieceDialog";
import { RowTitle } from "@/components/RowTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ADD_PHASE_LABEL,
  ADD_PIECE_LABEL,
  ADD_PHASE_SHORT_LABEL,
  ADD_PIECE_SHORT_LABEL,
  PIECE_COUNT_PLURAL_LABEL,
  PIECE_COUNT_SINGULAR_LABEL,
  PHASE_NAME_LABEL,
  PIECES_HEADING,
  PIECE_DRAG_TYPE,
  REMOVE_PHASE_LABEL,
} from "@/constants/projects";
import {
  piecesByPhase,
  type FicheSuggestions,
  type PhaseRecord,
  type PieceRecord,
} from "@/lib/projects";
import type { FileSectionRecord } from "@/lib/projectFiles";
import { cn } from "@/lib/utils";

type OpenDialog = { pieceId: number } | { phaseId: number | null } | null;

type ProjectPiecesProps = {
  projectId: string;
  phases: PhaseRecord[];
  pieces: PieceRecord[];
  fileSections: FileSectionRecord[];
  suggestions: FicheSuggestions;
};

function phaseKey(phase: PhaseRecord | null): string {
  return phase ? String(phase.id) : "";
}

export function ProjectPieces({
  projectId,
  phases,
  pieces,
  fileSections,
  suggestions,
}: ProjectPiecesProps) {
  const headingId = useId();
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [optimisticPieces, movePieceOptimistic] = useOptimistic(
    pieces,
    (current, move: { id: number; phaseId: number | null }) =>
      current.map((piece) =>
        piece.id === move.id ? { ...piece, phaseId: move.phaseId } : piece,
      ),
  );
  const canDrag = phases.length > 1;
  const closeDialog = () => setDialog(null);

  const openPiece =
    dialog && "pieceId" in dialog
      ? pieces.find(({ id }) => id === dialog.pieceId)
      : undefined;

  const dropOn = (phaseId: number | null, pieceId: number) =>
    startTransition(async () => {
      movePieceOptimistic({ id: pieceId, phaseId });
      await movePiece(pieceId, phaseId);
    });

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2.5">
      <div className="flex min-h-7 items-center gap-1.5">
        <RowTitle id={headingId}>{PIECES_HEADING}</RowTitle>
        <Button
          variant="ghost"
          size="sm"
          aria-label={ADD_PHASE_LABEL}
          disabled={pending}
          onClick={() => startTransition(() => addPhase(projectId))}
        >
          <Plus />
          {ADD_PHASE_SHORT_LABEL}
        </Button>
      </div>

      {piecesByPhase(phases, optimisticPieces).map(({ phase, pieces }) => {
        const key = phaseKey(phase);
        const phaseId = phase?.id ?? null;
        return (
          <div key={key} className="group/phase">
            {phase && (
              <div className="mb-2.5 flex items-center gap-1.5">
                <Input
                  aria-label={PHASE_NAME_LABEL}
                  defaultValue={phase.name}
                  onBlur={(e) => {
                    const name = e.target.value.trim();
                    if (name && name !== phase.name) {
                      startTransition(() => renamePhase(phase.id, name));
                    }
                  }}
                  className="hover:border-input h-7 max-w-56 border-transparent bg-transparent px-2 text-sm font-semibold shadow-none dark:bg-transparent"
                />
                <span className="text-muted-foreground text-xs">
                  {pieces.length > 0 &&
                    `${pieces.length} ${pieces.length > 1 ? PIECE_COUNT_PLURAL_LABEL : PIECE_COUNT_SINGULAR_LABEL}`}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="opacity-0 transition-opacity group-hover/phase:opacity-100 focus-visible:opacity-100"
                  aria-label={`${REMOVE_PHASE_LABEL} : ${phase.name}`}
                  disabled={pending}
                  onClick={() => startTransition(() => deletePhase(phase.id))}
                >
                  <X />
                </Button>
              </div>
            )}
            <ul
              onDragOver={(e) => {
                if (!e.dataTransfer.types.includes(PIECE_DRAG_TYPE)) {
                  return;
                }
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDropTarget(key);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                  setDropTarget(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDropTarget(null);
                const pieceId = Number(e.dataTransfer.getData(PIECE_DRAG_TYPE));
                if (Number.isInteger(pieceId)) {
                  dropOn(phaseId, pieceId);
                }
              }}
              className={cn(
                "-m-1 grid grid-cols-[repeat(auto-fill,minmax(var(--container-3xs),1fr))] gap-3.5 rounded-xl p-1 transition-colors",
                dropTarget === key &&
                  "bg-primary/5 outline-primary outline-2 -outline-offset-2 outline-dashed",
              )}
            >
              {pieces.map((piece) => (
                <PieceCard
                  key={piece.id}
                  projectId={projectId}
                  piece={piece}
                  draggable={canDrag}
                  onOpen={() => setDialog({ pieceId: piece.id })}
                />
              ))}
              <li className="flex">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialog({ phaseId })}
                  aria-label={ADD_PIECE_LABEL}
                  className="text-muted-foreground border-input min-h-30 w-full flex-1 rounded-xl border-2 border-dashed bg-transparent"
                >
                  <Plus />
                  {ADD_PIECE_SHORT_LABEL}
                </Button>
              </li>
            </ul>
          </div>
        );
      })}

      {dialog && "pieceId" in dialog && openPiece && (
        <PieceDialog
          key={openPiece.id}
          projectId={projectId}
          phaseId={openPiece.phaseId}
          phases={phases}
          suggestions={suggestions}
          piece={openPiece}
          sections={fileSections.filter(
            ({ pieceId }) => pieceId === openPiece.id,
          )}
          onClose={closeDialog}
        />
      )}
      {dialog && "phaseId" in dialog && (
        <PieceDialog
          projectId={projectId}
          phaseId={dialog.phaseId}
          phases={phases}
          suggestions={suggestions}
          sections={[]}
          onClose={closeDialog}
        />
      )}
    </section>
  );
}
