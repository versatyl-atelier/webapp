import { Effect, Schema } from "effect";

import { COVER_SET_MESSAGE } from "@/constants/projectFiles";
import { accessiblePiece, assertProjectAccess } from "@/effects/projects";
import type { PrismaService } from "@/generated/effect-prisma";
import { DEFAULT_COVER_FRAMING } from "@/lib/projectFiles";
import {
  CoverFramingSchema,
  PieceIdSchema,
  ProjectIdSchema,
  type CoverImageFormData,
  type CoverImageFormState,
} from "@/schemas/projects.schemas";

const COVER_FRAMING_COLUMNS = {
  coverX: DEFAULT_COVER_FRAMING.x,
  coverY: DEFAULT_COVER_FRAMING.y,
  coverZoom: DEFAULT_COVER_FRAMING.zoom,
};

const PieceIdFromStringSchema = Schema.NumberFromString.pipe(Schema.int());

export const saveCoverImageEffect = Effect.fn("saveCoverImage")(function* (
  prisma: PrismaService,
  _formState: CoverImageFormState,
  { pieceId, image }: CoverImageFormData,
) {
  const piece = yield* accessiblePiece(prisma, pieceId);
  const bytes = new Uint8Array(
    yield* Effect.promise(() => image.arrayBuffer()),
  );
  yield* prisma.$transaction(
    Effect.all([
      prisma.projectPieceCover.upsert({
        where: { pieceId: piece.id },
        create: { pieceId: piece.id, image: bytes, mimeType: image.type },
        update: { image: bytes, mimeType: image.type },
      }),
      prisma.projectPiece.update({
        where: { id: piece.id },
        data: { coverUpdatedAt: new Date(), ...COVER_FRAMING_COLUMNS },
      }),
    ]),
  );
  yield* Effect.annotateLogsScoped({
    projectId: piece.projectId,
    pieceId: piece.id,
    coverBytes: bytes.byteLength,
  });
  return { message: COVER_SET_MESSAGE };
});

export const clearPieceCoverEffect = Effect.fn("clearPieceCover")(function* (
  prisma: PrismaService,
  pieceId: unknown,
) {
  const piece = yield* accessiblePiece(prisma, pieceId);
  yield* prisma.$transaction(
    Effect.all([
      prisma.projectPieceCover.deleteMany({ where: { pieceId: piece.id } }),
      prisma.projectPiece.update({
        where: { id: piece.id },
        data: { coverUpdatedAt: null, ...COVER_FRAMING_COLUMNS },
      }),
    ]),
  );
});

export const setCoverFramingEffect = Effect.fn("setCoverFraming")(function* (
  prisma: PrismaService,
  pieceId: unknown,
  framing: unknown,
) {
  const id = yield* Schema.decodeUnknown(PieceIdSchema)(pieceId);
  const { x, y, zoom } =
    yield* Schema.decodeUnknown(CoverFramingSchema)(framing);
  const piece = yield* accessiblePiece(prisma, id);
  yield* prisma.projectPiece.update({
    where: { id: piece.id },
    data: { coverX: x, coverY: y, coverZoom: zoom },
  });
});

export const getCoverImageEffect = Effect.fn("getCoverImage")(function* (
  prisma: PrismaService,
  projectId: unknown,
  pieceId: unknown,
) {
  const project = yield* Schema.decodeUnknown(ProjectIdSchema)(projectId);
  yield* assertProjectAccess(prisma, project);
  const id = yield* Schema.decodeUnknown(PieceIdFromStringSchema)(pieceId).pipe(
    Effect.catchAll(() => Effect.succeed(null)),
  );
  if (id === null) {
    return null;
  }
  const piece = yield* prisma.projectPiece.findFirst({
    where: { id, projectId: project, isDeleted: false },
    select: { cover: { select: { image: true, mimeType: true } } },
  });
  return piece?.cover ?? null;
});
