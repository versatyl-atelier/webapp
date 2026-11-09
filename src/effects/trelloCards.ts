import { ConfigError, Effect, Schema } from "effect";

import { assertProjectAccess } from "@/effects/projects";
import {
  addTrelloLinkAttachment,
  createTrelloCard,
  deleteTrelloAttachment,
  isTrelloNotFound,
  listTrelloCardAttachments,
  setTrelloCardCover,
  trelloAppLink,
  updateTrelloCard,
} from "@/effects/trello";
import {
  TRELLO_COVER_FILE_NAME,
  TRELLO_LABEL_SEPARATOR,
  TRELLO_PROJECT_CARD_LABEL,
  TRELLO_PROJECT_LINK_NAME,
  TRELLO_ROLE_LABELS,
  TRELLO_SYNC_FAILED_MESSAGE,
  TRELLO_VARIANT_LABELS,
} from "@/constants/trello";
import type { PrismaService } from "@/generated/effect-prisma";
import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import {
  TrelloCardRole,
  TrelloCardState,
  TrelloCardVariant,
} from "@/generated/prisma/enums";
import { projectPath } from "@/lib/paths";
import { deliveryDate } from "@/lib/projects";
import {
  atelierVariants,
  designCardName,
  destinationKey,
  pieceCardDescription,
  pieceCardName,
  planDesignCards,
  planVariantCards,
} from "@/lib/trello";
import { ProjectIdSchema } from "@/schemas/projects.schemas";
import {
  TrelloCardRowIdSchema,
  TrelloError,
  TrelloNotConfigured,
  TrelloSubjectMissing,
} from "@/schemas/trello.schemas";

type TrelloSoftError =
  | TrelloError
  | TrelloNotConfigured
  | TrelloSubjectMissing
  | ConfigError.ConfigError;

const isTrelloSoftError = (error: unknown): error is TrelloSoftError =>
  error instanceof TrelloError ||
  error instanceof TrelloNotConfigured ||
  error instanceof TrelloSubjectMissing ||
  ConfigError.isConfigError(error);

export const bestEffortTrello = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<A | null, Exclude<E, TrelloSoftError>, R> =>
  effect.pipe(
    Effect.catchIf(
      (error): error is Extract<E, TrelloSoftError> => isTrelloSoftError(error),
      (error) =>
        Effect.logWarning(TRELLO_SYNC_FAILED_MESSAGE, error).pipe(
          Effect.as(null),
        ),
    ),
  ) as Effect.Effect<A | null, Exclude<E, TrelloSoftError>, R>;

const softly = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  effect.pipe(
    Effect.catchAll((error) =>
      Effect.logWarning(TRELLO_SYNC_FAILED_MESSAGE, error).pipe(Effect.asVoid),
    ),
  );

type CardSubject = {
  projectId: string;
  phaseId: number | null;
  pieceId: number | null;
  role: TrelloCardRole;
  variant: TrelloCardVariant;
};

const buildContent = Effect.fn("buildTrelloContent")(function* (
  prisma: PrismaService,
  subject: CardSubject,
) {
  const project = yield* prisma.project.findUnique({
    where: { id: subject.projectId },
    select: {
      name: true,
      manualDeliveryDate: true,
      calculatedDeliveryDate: true,
    },
  });
  if (!project) {
    return yield* new TrelloSubjectMissing({ projectId: subject.projectId });
  }
  const due = deliveryDate(project);
  if (subject.pieceId !== null) {
    const piece = yield* prisma.projectPiece.findUnique({
      where: { id: subject.pieceId },
      select: {
        type: true,
        description: true,
        caissonMaterial: true,
        cladding: true,
        countertop: true,
        drawers: true,
        finish: true,
        cabinetCount: true,
        cover: { select: { image: true, mimeType: true } },
      },
    });
    if (!piece) {
      return yield* new TrelloSubjectMissing({
        projectId: subject.projectId,
      });
    }
    return {
      name: pieceCardName(project.name, piece.type, subject.variant),
      desc: pieceCardDescription(piece),
      due,
      cover: piece.cover,
    };
  }
  const phase =
    subject.phaseId === null
      ? null
      : yield* prisma.projectPhase.findUnique({
          where: { id: subject.phaseId },
          select: { name: true },
        });
  return {
    name: designCardName(project.name, phase?.name ?? null),
    desc: "",
    due,
    cover: null,
  };
});

const createRemoteCard = Effect.fn("createRemoteTrelloCard")(function* (
  prisma: PrismaService,
  subject: CardSubject,
) {
  const key = destinationKey(subject.role, subject.variant);
  const destination = yield* prisma.trelloDestination.findUnique({
    where: { key },
  });
  if (!destination) {
    return yield* new TrelloNotConfigured({ key });
  }
  const content = yield* buildContent(prisma, subject);
  const card = yield* createTrelloCard({
    listId: destination.listId,
    name: content.name,
    desc: content.desc,
    due: content.due,
  });
  const link = yield* trelloAppLink(projectPath(subject.projectId));
  yield* softly(
    addTrelloLinkAttachment(card.id, TRELLO_PROJECT_LINK_NAME, link),
  );
  if (content.cover) {
    yield* softly(
      setTrelloCardCover(card.id, {
        bytes: content.cover.image,
        mimeType: content.cover.mimeType,
      }),
    );
  }
  return {
    trelloCardId: card.id,
    boardId: card.idBoard,
    listId: card.idList,
  };
});

const publishCard = Effect.fn("publishTrelloCard")(function* (
  prisma: PrismaService,
  subject: CardSubject,
) {
  const remote = yield* createRemoteCard(prisma, subject);
  return yield* prisma.trelloCard.create({
    data: { ...subject, ...remote },
    select: { id: true },
  });
});

const setClosed = Effect.fn("setTrelloCardClosed")(function* (
  prisma: PrismaService,
  card: { id: number; trelloCardId: string },
  closed: boolean,
) {
  const reachable = yield* updateTrelloCard(card.trelloCardId, { closed }).pipe(
    Effect.as(true),
    Effect.catchIf(isTrelloNotFound, () => Effect.succeed(false)),
  );
  const state = closed ? TrelloCardState.hidden : TrelloCardState.active;
  yield* prisma.trelloCard.update({
    where: { id: card.id },
    data: { state: reachable ? state : TrelloCardState.lost },
  });
});

const replaceCover = Effect.fn("replaceTrelloCover")(function* (
  trelloCardId: string,
  cover: { image: Uint8Array<ArrayBuffer>; mimeType: string } | null,
) {
  const attachments = yield* listTrelloCardAttachments(trelloCardId);
  for (const { id } of attachments.filter(
    ({ name }) => name === TRELLO_COVER_FILE_NAME,
  )) {
    yield* deleteTrelloAttachment(trelloCardId, id);
  }
  if (cover) {
    yield* setTrelloCardCover(trelloCardId, {
      bytes: cover.image,
      mimeType: cover.mimeType,
    });
  }
});

export const syncPieceCover = Effect.fn("syncPieceCover")(function* (
  prisma: PrismaService,
  pieceId: number,
) {
  const cards = yield* prisma.trelloCard.findMany({
    where: {
      pieceId,
      state: {
        in: [
          TrelloCardState.active,
          TrelloCardState.hidden,
          TrelloCardState.archived,
        ],
      },
    },
    select: { trelloCardId: true },
  });
  if (cards.length === 0) {
    return;
  }
  const cover = yield* prisma.projectPieceCover.findUnique({
    where: { pieceId },
    select: { image: true, mimeType: true },
  });
  for (const { trelloCardId } of cards) {
    yield* softly(replaceCover(trelloCardId, cover));
  }
});

const cardRows = (prisma: PrismaService, ids: readonly number[]) =>
  prisma.trelloCard.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true, trelloCardId: true },
  });

export const syncDesignCards = Effect.fn("syncDesignCards")(function* (
  prisma: PrismaService,
  projectId: string,
  force: boolean,
) {
  yield* Effect.annotateLogsScoped({ projectId });
  const phases = yield* prisma.projectPhase.findMany({
    where: { projectId, isDeleted: false },
    select: { id: true },
    orderBy: { sortOrder: SortOrder.asc },
  });
  const cards = yield* prisma.trelloCard.findMany({
    where: { projectId, role: TrelloCardRole.design },
    select: { id: true, phaseId: true, state: true },
    orderBy: { id: SortOrder.asc },
  });
  if (!force && cards.length === 0) {
    return;
  }
  const plan = planDesignCards(
    cards,
    phases.map(({ id }) => id),
    { reopen: force },
  );
  const subject = (phaseId: number | null): CardSubject => ({
    projectId,
    phaseId,
    pieceId: null,
    role: TrelloCardRole.design,
    variant: TrelloCardVariant.simple,
  });
  for (const { id, phaseId } of plan.rebind) {
    const row = yield* prisma.trelloCard.update({
      where: { id },
      data: { phaseId },
      select: { id: true, trelloCardId: true },
    });
    const { name } = yield* buildContent(prisma, subject(phaseId));
    yield* softly(updateTrelloCard(row.trelloCardId, { name }));
  }
  for (const row of yield* cardRows(prisma, plan.show)) {
    yield* setClosed(prisma, row, false);
  }
  for (const row of yield* cardRows(prisma, plan.hide)) {
    yield* setClosed(prisma, row, true);
  }
  for (const phaseId of plan.create) {
    yield* publishCard(prisma, subject(phaseId));
  }
});

export const syncPieceCards = Effect.fn("syncPieceCards")(function* (
  prisma: PrismaService,
  projectId: string,
  role: typeof TrelloCardRole.planification | typeof TrelloCardRole.atelier,
  options: { force: boolean; pieceId?: number },
) {
  yield* Effect.annotateLogsScoped({ projectId, trelloRole: role });
  const pieces = yield* prisma.projectPiece.findMany({
    where: {
      projectId,
      ...(options.pieceId === undefined ? {} : { id: options.pieceId }),
    },
    select: {
      id: true,
      isDeleted: true,
      hasCaisson: true,
      hasFinition: true,
      trelloCards: {
        where: { role },
        select: { id: true, variant: true, state: true },
      },
    },
    orderBy: [{ sortOrder: SortOrder.asc }, { id: SortOrder.asc }],
  });
  for (const piece of pieces) {
    if (!options.force && piece.trelloCards.length === 0) {
      continue;
    }
    const desired = piece.isDeleted
      ? []
      : role === TrelloCardRole.planification
        ? [TrelloCardVariant.simple]
        : atelierVariants(piece);
    const plan = planVariantCards(piece.trelloCards, desired, {
      reopen: options.force,
    });
    for (const row of yield* cardRows(prisma, plan.show)) {
      yield* setClosed(prisma, row, false);
    }
    for (const row of yield* cardRows(prisma, plan.hide)) {
      yield* setClosed(prisma, row, true);
    }
    if (options.force) {
      yield* softly(syncPieceCover(prisma, piece.id));
    }
    for (const variant of plan.create) {
      yield* publishCard(prisma, {
        projectId,
        phaseId: null,
        pieceId: piece.id,
        role,
        variant,
      });
    }
  }
});

export const syncAllPieceCards = Effect.fn("syncAllPieceCards")(function* (
  prisma: PrismaService,
  projectId: string,
  pieceId: number,
) {
  yield* syncPieceCards(prisma, projectId, TrelloCardRole.planification, {
    force: false,
    pieceId,
  });
  yield* syncPieceCards(prisma, projectId, TrelloCardRole.atelier, {
    force: false,
    pieceId,
  });
});

export const createDesignCardEffect = Effect.fn("createDesignCard")(function* (
  prisma: PrismaService,
  projectId: unknown,
) {
  const id = yield* Schema.decodeUnknown(ProjectIdSchema)(projectId);
  yield* assertProjectAccess(prisma, id);
  const result = yield* bestEffortTrello(syncDesignCards(prisma, id, true));
  return result !== null;
});

export const sendPieceCardsEffect = Effect.fn("sendPieceCards")(function* (
  prisma: PrismaService,
  projectId: unknown,
  role: unknown,
) {
  const id = yield* Schema.decodeUnknown(ProjectIdSchema)(projectId);
  const target = yield* Schema.decodeUnknown(
    Schema.Literal(TrelloCardRole.planification, TrelloCardRole.atelier),
  )(role);
  yield* assertProjectAccess(prisma, id);
  const result = yield* bestEffortTrello(
    syncPieceCards(prisma, id, target, { force: true }),
  );
  return result !== null;
});

export const regenerateCardEffect = Effect.fn("regenerateCard")(function* (
  prisma: PrismaService,
  cardId: unknown,
) {
  const id = yield* Schema.decodeUnknown(TrelloCardRowIdSchema)(cardId);
  const card = yield* prisma.trelloCard.findUnique({
    where: { id },
    select: {
      projectId: true,
      phaseId: true,
      pieceId: true,
      role: true,
      variant: true,
      state: true,
    },
  });
  if (!card) {
    return false;
  }
  yield* assertProjectAccess(prisma, card.projectId);
  if (card.state !== TrelloCardState.lost) {
    return false;
  }
  const { state: _state, ...subject } = card;
  const result = yield* bestEffortTrello(
    createRemoteCard(prisma, subject).pipe(
      Effect.flatMap((remote) =>
        prisma.trelloCard.update({
          where: { id },
          data: { ...remote, state: TrelloCardState.active },
        }),
      ),
    ),
  );
  return result !== null;
});

export const getProjectTrelloEffect = Effect.fn("getProjectTrello")(function* (
  prisma: PrismaService,
  projectId: unknown,
) {
  const id = yield* Schema.decodeUnknown(ProjectIdSchema)(projectId);
  yield* assertProjectAccess(prisma, id);
  const [destinations, pieceCount, cards] = yield* Effect.all([
    prisma.trelloDestination.findMany({ select: { key: true } }),
    prisma.projectPiece.count({ where: { projectId: id, isDeleted: false } }),
    prisma.trelloCard.findMany({
      where: { projectId: id },
      select: {
        id: true,
        role: true,
        variant: true,
        state: true,
        piece: { select: { type: true } },
        phase: { select: { name: true } },
      },
      orderBy: { id: SortOrder.asc },
    }),
  ]);
  return {
    keys: destinations.map(({ key }) => key),
    pieceCount,
    lost: cards
      .filter(({ state }) => state === TrelloCardState.lost)
      .map(({ id: cardId, role, variant, piece, phase }) => ({
        id: cardId,
        label: [
          TRELLO_ROLE_LABELS[role],
          piece?.type ?? phase?.name ?? TRELLO_PROJECT_CARD_LABEL,
          TRELLO_VARIANT_LABELS[variant],
        ]
          .filter(Boolean)
          .join(TRELLO_LABEL_SEPARATOR),
      })),
  };
});
