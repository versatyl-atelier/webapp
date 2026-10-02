import type { PrismaService } from "@/generated/effect-prisma";
import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import {
  StatutStagePermissionFindManyArgs,
  ProjectFindManyArgs,
  ProjectWhereInput,
} from "@/generated/prisma/models";
import { Effect, Schema } from "effect";
import { assertEmployeeAccess, getActiveSession } from "@/effects/auth";
import { Role } from "@/generated/prisma/enums";
import {
  CONTACTS_SAVED_MESSAGE,
  NOTE_NOT_FOUND_MESSAGE,
  NOTE_SAVED_MESSAGE,
  PHASE_NOT_FOUND_MESSAGE,
  PIECE_NOT_FOUND_MESSAGE,
  PIECE_SAVED_MESSAGE,
  PROJECT_SAVED_MESSAGE,
  RECENT_SUGGESTION_ROWS,
} from "@/constants/projects";
import { toDbDate, type DateKey } from "@/lib/calendar";
import {
  buildSuggestions,
  isEmptyContact,
  nextSortOrder,
  phaseName,
  type ProjectFiche,
} from "@/lib/projects";
import type { NoteRecord } from "@/lib/projectNotes";
import { Forbidden } from "@/schemas/auth.schemas";
import {
  NoteIdSchema,
  PhaseIdSchema,
  PhaseNameSchema,
  PieceIdSchema,
  type NoteEditFormData,
  type NoteEditFormState,
  type NoteFormData,
  type NoteFormState,
  type PieceFormData,
  type PieceFormState,
  type ProjectContactsFormData,
  type ProjectContactsFormState,
  type ProjectHeaderFormData,
  type ProjectHeaderFormState,
} from "@/schemas/projects.schemas";

const getAllowedStages = Effect.fn("getAllowedStages")(function* (
  prisma: PrismaService,
  employeeId: number,
) {
  const opts: StatutStagePermissionFindManyArgs = {
    where: {
      statut: {
        employees: {
          some: {
            id: employeeId,
          },
        },
      },
    },
    select: {
      stage: true,
    },
  };
  return (yield* prisma.statutStagePermission.findMany(opts)).map(
    ({ stage }) => stage,
  );
});

export const getProjectsEffect = Effect.fn("getProjects")(function* (
  prisma: PrismaService,
  employeeId: number,
) {
  yield* assertEmployeeAccess(employeeId);
  const allowedStages = yield* getAllowedStages(prisma, employeeId);
  if (allowedStages.length === 0) {
    return [];
  }
  const args: ProjectFindManyArgs = {
    where: {
      stage: {
        in: allowedStages,
      },
    },
    orderBy: {
      name: SortOrder.asc,
    },
  };
  return yield* prisma.project.findMany(args);
});

export const getAllProjectsEffect = Effect.fn("getAllProjects")(function* (
  prisma: PrismaService,
) {
  const args: ProjectFindManyArgs = {
    select: {
      id: true,
      name: true,
      isDeleted: true,
      color: true,
    },
    orderBy: {
      name: SortOrder.asc,
    },
  };
  return yield* prisma.project.findMany(args);
});

export const accessibleProjectsWhere = Effect.fn("accessibleProjectsWhere")(
  function* (prisma: PrismaService) {
    const session = yield* getActiveSession();
    if (session.role === Role.manager) {
      return {} satisfies ProjectWhereInput;
    }
    if (session.employeeId === null) {
      return null;
    }
    const allowedStages = yield* getAllowedStages(prisma, session.employeeId);
    return { stage: { in: allowedStages } } satisfies ProjectWhereInput;
  },
);

const assertProjectAccess = Effect.fn("assertProjectAccess")(function* (
  prisma: PrismaService,
  projectId: string,
) {
  yield* Effect.annotateLogsScoped({ projectId });
  const where = yield* accessibleProjectsWhere(prisma);
  const count = where
    ? yield* prisma.project.count({ where: { ...where, id: projectId } })
    : 0;
  if (count === 0) {
    return yield* new Forbidden({ projectId });
  }
});

export const getProjectEffect = Effect.fn("getProject")(function* (
  prisma: PrismaService,
  id: string,
) {
  const where = yield* accessibleProjectsWhere(prisma);
  if (!where) {
    return null;
  }
  const project: ProjectFiche | null = yield* prisma.project.findFirst({
    where: { ...where, id },
    select: {
      id: true,
      name: true,
      stage: true,
      color: true,
      address: true,
      contacts: {
        select: {
          role: true,
          name: true,
          company: true,
          phone: true,
          email: true,
        },
        orderBy: { sortOrder: SortOrder.asc },
      },
      phases: {
        select: { id: true, name: true },
        orderBy: { sortOrder: SortOrder.asc },
      },
      pieces: {
        select: {
          id: true,
          phaseId: true,
          type: true,
          caissonMaterial: true,
          cladding: true,
          doors: true,
          drawers: true,
          hardware: true,
          finish: true,
          cabinetCount: true,
        },
        orderBy: [{ sortOrder: SortOrder.asc }, { id: SortOrder.asc }],
      },
    },
  });
  return project;
});

export const getPipelineProjectsEffect = Effect.fn("getPipelineProjects")(
  function* (prisma: PrismaService) {
    const where = yield* accessibleProjectsWhere(prisma);
    if (!where) {
      return [];
    }
    const projects = yield* prisma.project.findMany({
      where: { AND: [where, { isDeleted: false, stage: { not: null } }] },
      select: { id: true, name: true, stage: true, color: true },
      orderBy: { name: SortOrder.asc },
    });
    yield* Effect.annotateLogsScoped({ pipelineProjects: projects.length });
    return projects;
  },
);

export const getUpcomingDeliveriesEffect = Effect.fn("getUpcomingDeliveries")(
  function* (prisma: PrismaService, from: DateKey, to: DateKey) {
    const where = yield* accessibleProjectsWhere(prisma);
    if (!where) {
      return [];
    }
    const range = { gte: toDbDate(from), lte: toDbDate(to) };
    const projects = yield* prisma.project.findMany({
      where: {
        AND: [
          where,
          {
            isDeleted: false,
            OR: [
              { manualDeliveryDate: range },
              { manualDeliveryDate: null, calculatedDeliveryDate: range },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        color: true,
        manualDeliveryDate: true,
        calculatedDeliveryDate: true,
      },
    });
    yield* Effect.annotateLogsScoped({
      deliveriesFrom: from,
      deliveriesTo: to,
      upcomingDeliveries: projects.length,
    });
    return projects;
  },
);

export const getFicheSuggestionsEffect = Effect.fn("getFicheSuggestions")(
  function* (prisma: PrismaService) {
    const where = yield* accessibleProjectsWhere(prisma);
    const project = where ?? { id: { in: [] } };
    const [pieces, contacts] = yield* Effect.all([
      prisma.projectPiece.findMany({
        where: { project },
        select: {
          type: true,
          caissonMaterial: true,
          cladding: true,
          doors: true,
          drawers: true,
          hardware: true,
          finish: true,
        },
        orderBy: { updatedAt: SortOrder.desc },
        take: RECENT_SUGGESTION_ROWS,
      }),
      prisma.projectContact.findMany({
        where: { project },
        select: { role: true, company: true },
        orderBy: { updatedAt: SortOrder.desc },
        take: RECENT_SUGGESTION_ROWS,
      }),
    ]);
    return buildSuggestions(pieces, contacts);
  },
);

export const saveProjectHeaderEffect = Effect.fn("saveProjectHeader")(
  function* (
    prisma: PrismaService,
    _formState: ProjectHeaderFormState,
    { projectId, ...data }: ProjectHeaderFormData,
  ) {
    yield* assertProjectAccess(prisma, projectId);
    yield* prisma.project.update({ where: { id: projectId }, data });
    return { message: PROJECT_SAVED_MESSAGE };
  },
);

export const saveProjectContactsEffect = Effect.fn("saveProjectContacts")(
  function* (
    prisma: PrismaService,
    _formState: ProjectContactsFormState,
    form: ProjectContactsFormData,
  ) {
    yield* assertProjectAccess(prisma, form.projectId);
    const contacts = form.contacts.filter(
      (contact) => !isEmptyContact(contact),
    );
    yield* Effect.annotateLogsScoped({ contacts: contacts.length });
    yield* prisma.$transaction(
      Effect.all([
        prisma.projectContact.deleteMany({
          where: { projectId: form.projectId },
        }),
        prisma.projectContact.createMany({
          data: contacts.map((contact, sortOrder) => ({
            ...contact,
            projectId: form.projectId,
            sortOrder,
          })),
        }),
      ]),
    );
    return { message: CONTACTS_SAVED_MESSAGE };
  },
);

const phaseBelongsTo = Effect.fn("phaseBelongsTo")(function* (
  prisma: PrismaService,
  projectId: string,
  phaseId: number | null,
) {
  if (phaseId === null) {
    return true;
  }
  const count = yield* prisma.projectPhase.count({
    where: { id: phaseId, projectId },
  });
  return count > 0;
});

const piecesSortOrder = Effect.fn("piecesSortOrder")(function* (
  prisma: PrismaService,
  projectId: string,
  phaseId: number | null,
) {
  const pieces = yield* prisma.projectPiece.findMany({
    where: { projectId, phaseId },
    select: { sortOrder: true },
  });
  return nextSortOrder(pieces);
});

export const savePieceEffect = Effect.fn("savePiece")(function* (
  prisma: PrismaService,
  _formState: PieceFormState,
  { projectId, id, phaseId, ...fields }: PieceFormData,
) {
  yield* assertProjectAccess(prisma, projectId);
  yield* Effect.annotateLogsScoped({ pieceId: id, phaseId });
  if (!(yield* phaseBelongsTo(prisma, projectId, phaseId))) {
    return { errors: { dataValidation: PHASE_NOT_FOUND_MESSAGE } };
  }
  if (id === undefined) {
    const piece = yield* prisma.projectPiece.create({
      data: {
        ...fields,
        projectId,
        phaseId,
        sortOrder: yield* piecesSortOrder(prisma, projectId, phaseId),
      },
      select: { id: true },
    });
    yield* Effect.annotateLogsScoped({ createdPieceId: piece.id });
    return { message: PIECE_SAVED_MESSAGE };
  }
  const current = yield* prisma.projectPiece.findFirst({
    where: { id, projectId },
    select: { phaseId: true },
  });
  if (!current) {
    return { errors: { dataValidation: PIECE_NOT_FOUND_MESSAGE } };
  }
  yield* prisma.projectPiece.update({
    where: { id },
    data: {
      ...fields,
      phaseId,
      ...(current.phaseId === phaseId
        ? {}
        : { sortOrder: yield* piecesSortOrder(prisma, projectId, phaseId) }),
    },
  });
  return { message: PIECE_SAVED_MESSAGE };
});

export const addPhaseEffect = Effect.fn("addPhase")(function* (
  prisma: PrismaService,
  projectId: string,
) {
  yield* assertProjectAccess(prisma, projectId);
  const phases = yield* prisma.projectPhase.findMany({
    where: { projectId },
    select: { sortOrder: true },
  });
  const isFirst = phases.length === 0;
  const sortOrder = nextSortOrder(phases);
  yield* prisma.$transaction(
    Effect.gen(function* () {
      if (isFirst) {
        const first = yield* prisma.projectPhase.create({
          data: { projectId, name: phaseName(1), sortOrder },
          select: { id: true },
        });
        yield* prisma.projectPiece.updateMany({
          where: { projectId, phaseId: null },
          data: { phaseId: first.id },
        });
      }
      yield* prisma.projectPhase.create({
        data: {
          projectId,
          name: phaseName(phases.length + (isFirst ? 2 : 1)),
          sortOrder: sortOrder + (isFirst ? 1 : 0),
        },
      });
    }),
  );
});

const phaseProjectId = Effect.fn("phaseProjectId")(function* (
  prisma: PrismaService,
  phaseId: unknown,
) {
  const id = yield* Schema.decodeUnknown(PhaseIdSchema)(phaseId);
  const phase = yield* prisma.projectPhase.findUnique({
    where: { id },
    select: { projectId: true },
  });
  if (!phase) {
    return yield* new Forbidden({});
  }
  yield* assertProjectAccess(prisma, phase.projectId);
  return { id, projectId: phase.projectId };
});

export const renamePhaseEffect = Effect.fn("renamePhase")(function* (
  prisma: PrismaService,
  phaseId: unknown,
  name: unknown,
) {
  const phase = yield* phaseProjectId(prisma, phaseId);
  const trimmed = yield* Schema.decodeUnknown(PhaseNameSchema)(name);
  yield* prisma.projectPhase.update({
    where: { id: phase.id },
    data: { name: trimmed },
  });
});

export const deletePhaseEffect = Effect.fn("deletePhase")(function* (
  prisma: PrismaService,
  phaseId: unknown,
) {
  const phase = yield* phaseProjectId(prisma, phaseId);
  const fallback = yield* prisma.projectPhase.findFirst({
    where: { projectId: phase.projectId, id: { not: phase.id } },
    select: { id: true },
    orderBy: { sortOrder: SortOrder.asc },
  });
  const fallbackId = fallback?.id ?? null;
  const sortOrder = yield* piecesSortOrder(prisma, phase.projectId, fallbackId);
  yield* prisma.$transaction(
    Effect.all([
      prisma.projectPiece.updateMany({
        where: { phaseId: phase.id },
        data: { phaseId: fallbackId, sortOrder },
      }),
      prisma.projectPhase.delete({ where: { id: phase.id } }),
    ]),
  );
});

const accessiblePiece = Effect.fn("accessiblePiece")(function* (
  prisma: PrismaService,
  pieceId: unknown,
) {
  const id = yield* Schema.decodeUnknown(PieceIdSchema)(pieceId);
  yield* Effect.annotateLogsScoped({ pieceId: id });
  const piece = yield* prisma.projectPiece.findUnique({
    where: { id },
    select: { id: true, projectId: true, phaseId: true },
  });
  if (!piece) {
    return yield* new Forbidden({});
  }
  yield* assertProjectAccess(prisma, piece.projectId);
  return piece;
});

export const deletePieceEffect = Effect.fn("deletePiece")(function* (
  prisma: PrismaService,
  pieceId: unknown,
) {
  const piece = yield* accessiblePiece(prisma, pieceId);
  yield* prisma.projectPiece.delete({ where: { id: piece.id } });
});

export const movePieceEffect = Effect.fn("movePiece")(function* (
  prisma: PrismaService,
  pieceId: unknown,
  phaseId: unknown,
) {
  const piece = yield* accessiblePiece(prisma, pieceId);
  const id = piece.id;
  const target = yield* Schema.decodeUnknown(Schema.NullOr(PhaseIdSchema))(
    phaseId,
  );
  yield* Effect.annotateLogsScoped({ phaseId: target });
  if (
    piece.phaseId === target ||
    !(yield* phaseBelongsTo(prisma, piece.projectId, target))
  ) {
    return;
  }
  yield* prisma.projectPiece.update({
    where: { id },
    data: {
      phaseId: target,
      sortOrder: yield* piecesSortOrder(prisma, piece.projectId, target),
    },
  });
});

export const getProjectNotesEffect = Effect.fn("getProjectNotes")(function* (
  prisma: PrismaService,
  projectId: string,
) {
  yield* assertProjectAccess(prisma, projectId);
  const notes: NoteRecord[] = yield* prisma.projectNote.findMany({
    where: { projectId },
    select: {
      id: true,
      phaseId: true,
      isDeleted: true,
      versions: {
        select: {
          id: true,
          body: true,
          stage: true,
          createdAt: true,
          author: { select: { id: true, name: true } },
        },
        orderBy: [{ createdAt: SortOrder.asc }, { id: SortOrder.asc }],
      },
    },
    orderBy: [{ createdAt: SortOrder.asc }, { id: SortOrder.asc }],
  });
  yield* Effect.annotateLogsScoped({ notes: notes.length });
  return notes;
});

const newNoteVersion = Effect.fn("newNoteVersion")(function* (
  prisma: PrismaService,
  projectId: string,
  body: string,
) {
  const session = yield* getActiveSession();
  const project = yield* prisma.project.findUnique({
    where: { id: projectId },
    select: { stage: true },
  });
  return { body, authorId: session.userId, stage: project?.stage ?? null };
});

export const addNoteEffect = Effect.fn("addNote")(function* (
  prisma: PrismaService,
  _formState: NoteFormState,
  { projectId, phaseId, body }: NoteFormData,
) {
  yield* assertProjectAccess(prisma, projectId);
  yield* Effect.annotateLogsScoped({ phaseId });
  if (!(yield* phaseBelongsTo(prisma, projectId, phaseId))) {
    return { errors: { dataValidation: PHASE_NOT_FOUND_MESSAGE } };
  }
  const note = yield* prisma.projectNote.create({
    data: {
      projectId,
      phaseId,
      versions: {
        create: yield* newNoteVersion(prisma, projectId, body),
      },
    },
    select: { id: true },
  });
  yield* Effect.annotateLogsScoped({ createdNoteId: note.id });
  return { message: NOTE_SAVED_MESSAGE };
});

const accessibleNote = Effect.fn("accessibleNote")(function* (
  prisma: PrismaService,
  noteId: unknown,
) {
  const id = yield* Schema.decodeUnknown(NoteIdSchema)(noteId);
  yield* Effect.annotateLogsScoped({ noteId: id });
  const note = yield* prisma.projectNote.findUnique({
    where: { id },
    select: { id: true, projectId: true, isDeleted: true },
  });
  if (!note) {
    return yield* new Forbidden({});
  }
  yield* assertProjectAccess(prisma, note.projectId);
  return note;
});

export const editNoteEffect = Effect.fn("editNote")(function* (
  prisma: PrismaService,
  _formState: NoteEditFormState,
  { id, body }: NoteEditFormData,
) {
  const note = yield* accessibleNote(prisma, id);
  if (note.isDeleted) {
    return { errors: { dataValidation: NOTE_NOT_FOUND_MESSAGE } };
  }
  yield* prisma.projectNoteVersion.create({
    data: {
      noteId: note.id,
      ...(yield* newNoteVersion(prisma, note.projectId, body)),
    },
  });
  return { message: NOTE_SAVED_MESSAGE };
});

export const deleteNoteEffect = Effect.fn("deleteNote")(function* (
  prisma: PrismaService,
  noteId: unknown,
) {
  const note = yield* accessibleNote(prisma, noteId);
  if (note.isDeleted) {
    return;
  }
  const session = yield* getActiveSession();
  yield* prisma.projectNote.update({
    where: { id: note.id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: session.userId,
    },
  });
});

export const restoreNoteEffect = Effect.fn("restoreNote")(function* (
  prisma: PrismaService,
  noteId: unknown,
) {
  const note = yield* accessibleNote(prisma, noteId);
  if (!note.isDeleted) {
    return;
  }
  const latest = yield* prisma.projectNoteVersion.findFirst({
    where: { noteId: note.id },
    select: { body: true },
    orderBy: [{ createdAt: SortOrder.desc }, { id: SortOrder.desc }],
  });
  if (!latest) {
    return;
  }
  yield* prisma.projectNote.update({
    where: { id: note.id },
    data: {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      versions: {
        create: yield* newNoteVersion(prisma, note.projectId, latest.body),
      },
    },
  });
});
