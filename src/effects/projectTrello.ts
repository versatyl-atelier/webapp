import { Effect, Schema } from "effect";

import {
  addPhaseEffect,
  deletePhaseEffect,
  deletePieceEffect,
  restorePieceEffect,
} from "@/effects/projects";
import {
  bestEffortTrello,
  syncAllPieceCards,
  syncDesignCards,
} from "@/effects/trelloCards";
import type { PrismaService } from "@/generated/effect-prisma";
import { PhaseIdSchema, PieceIdSchema } from "@/schemas/projects.schemas";

export const addPhaseWithTrelloEffect = Effect.fn("addPhase")(function* (
  prisma: PrismaService,
  projectId: string,
) {
  yield* addPhaseEffect(prisma, projectId);
  yield* bestEffortTrello(syncDesignCards(prisma, projectId, false));
});

export const deletePhaseWithTrelloEffect = Effect.fn("deletePhase")(function* (
  prisma: PrismaService,
  phaseId: unknown,
) {
  const id = yield* Schema.decodeUnknown(PhaseIdSchema)(phaseId);
  const phase = yield* prisma.projectPhase.findUnique({
    where: { id },
    select: { projectId: true },
  });
  yield* deletePhaseEffect(prisma, id);
  if (phase) {
    yield* bestEffortTrello(syncDesignCards(prisma, phase.projectId, false));
  }
});

const pieceProjectId = Effect.fn("pieceProjectId")(function* (
  prisma: PrismaService,
  pieceId: unknown,
) {
  const id = yield* Schema.decodeUnknown(PieceIdSchema)(pieceId);
  const piece = yield* prisma.projectPiece.findUnique({
    where: { id },
    select: { projectId: true },
  });
  return { id, projectId: piece?.projectId ?? null };
});

export const deletePieceWithTrelloEffect = Effect.fn("deletePiece")(function* (
  prisma: PrismaService,
  pieceId: unknown,
) {
  const piece = yield* pieceProjectId(prisma, pieceId);
  yield* deletePieceEffect(prisma, piece.id);
  if (piece.projectId) {
    yield* bestEffortTrello(
      syncAllPieceCards(prisma, piece.projectId, piece.id),
    );
  }
});

export const restorePieceWithTrelloEffect = Effect.fn("restorePiece")(
  function* (prisma: PrismaService, pieceId: unknown) {
    const piece = yield* pieceProjectId(prisma, pieceId);
    yield* restorePieceEffect(prisma, piece.id);
    if (piece.projectId) {
      yield* bestEffortTrello(
        syncAllPieceCards(prisma, piece.projectId, piece.id),
      );
    }
  },
);
