import { Effect, Schema } from "effect";

import {
  LANCEUR_OPTION_EXISTS_MESSAGE,
  LANCEUR_PHASE_ALREADY_ADDED_MESSAGE,
  LANCEUR_PHASE_NOT_FOUND_MESSAGE,
  LANCEUR_UNKNOWN_OPTION_MESSAGE,
} from "@/constants/lanceur";
import type { PrismaService } from "@/generated/effect-prisma";
import { LanceurOptionField } from "@/generated/prisma/enums";
import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import type {
  EmployeeFindManyArgs,
  LanceurOptionFindManyArgs,
  LanceurPhaseCreateArgs,
  LanceurPhaseFindManyArgs,
  LanceurPhaseUpdateArgs,
  ProjectPhaseFindManyArgs,
} from "@/generated/prisma/models";
import { toDateKey, toDbDate } from "@/lib/calendar";
import type { LanceurRow } from "@/lib/lanceur";
import { normalizeStoredRichText } from "@/lib/richText";
import {
  LanceurOptionInputSchema,
  LanceurPatchSchema,
  type LanceurMutationResult,
} from "@/schemas/lanceur.schemas";

const OK: LanceurMutationResult = {};

function failure(error: string): LanceurMutationResult {
  return { error };
}

function toDbDateOrNull(value: string | null | undefined) {
  if (value === undefined || value === null) {
    return value;
  }
  return toDbDate(value);
}

export const getLanceurRowsEffect = Effect.fn("getLanceurRows")(function* (
  prisma: PrismaService,
) {
  const args = {
    where: { phase: { isDeleted: false, project: { isDeleted: false } } },
    include: {
      phase: {
        include: {
          project: {
            select: {
              id: true,
              name: true,
              _count: { select: { phases: { where: { isDeleted: false } } } },
            },
          },
        },
      },
      responsible: { select: { id: true, name: true, color: true } },
    },
    orderBy: [{ priority: SortOrder.asc }, { phaseId: SortOrder.asc }],
  } satisfies LanceurPhaseFindManyArgs;
  const records = yield* prisma.lanceurPhase.findMany(args);
  return records.map((record): LanceurRow => ({
    phaseId: record.phaseId,
    projectId: record.phase.project.id,
    projectName: record.phase.project.name,
    phaseName: record.phase.name,
    phaseCount: record.phase.project._count.phases,
    priority: record.priority,
    etape: record.etape,
    isSigned: record.isSigned,
    approvedOverride: record.isApproved,
    pdmDate: record.pdmDate ? toDateKey(record.pdmDate) : null,
    approvalDate: record.approvalDate ? toDateKey(record.approvalDate) : null,
    deliveryDate: record.deliveryDate ? toDateKey(record.deliveryDate) : null,
    price: record.price,
    installateur: record.installateur,
    deliveryComment: record.deliveryComment,
    responsibleId: record.responsibleId,
    responsibleName: record.responsible?.name ?? null,
    responsibleColor: record.responsible?.color ?? null,
  }));
});

export const getLanceurOptionsEffect = Effect.fn("getLanceurOptions")(
  function* (prisma: PrismaService) {
    const args: LanceurOptionFindManyArgs = {
      orderBy: [{ sortOrder: SortOrder.asc }, { id: SortOrder.asc }],
    };
    return yield* prisma.lanceurOption.findMany(args);
  },
);

export const getLanceurEmployeesEffect = Effect.fn("getLanceurEmployees")(
  function* (prisma: PrismaService) {
    const args: EmployeeFindManyArgs = {
      where: { isDeleted: false },
      select: { id: true, name: true, color: true },
      orderBy: { displayOrder: SortOrder.asc },
    };
    return yield* prisma.employee.findMany(args);
  },
);

export const getAvailablePhasesEffect = Effect.fn("getAvailablePhases")(
  function* (prisma: PrismaService) {
    const args = {
      where: {
        isDeleted: false,
        lanceur: null,
        project: { isDeleted: false },
      },
      include: {
        project: {
          select: {
            name: true,
            _count: { select: { phases: { where: { isDeleted: false } } } },
          },
        },
      },
      orderBy: [{ projectId: SortOrder.asc }, { sortOrder: SortOrder.asc }],
    } satisfies ProjectPhaseFindManyArgs;
    const phases = yield* prisma.projectPhase.findMany(args);
    return phases.map((phase) => ({
      phaseId: phase.id,
      projectName: phase.project.name,
      phaseName: phase.name,
      phaseCount: phase.project._count.phases,
    }));
  },
);

const optionExists = Effect.fn("optionExists")(function* (
  prisma: PrismaService,
  field: LanceurOptionField,
  value: string,
) {
  const found = yield* prisma.lanceurOption.findFirst({
    where: { field, value },
  });
  return found !== null;
});

export const updateLanceurPhaseEffect = Effect.fn("updateLanceurPhase")(
  function* (prisma: PrismaService, phaseId: number, rawPatch: unknown) {
    yield* Effect.annotateLogsScoped({ phaseId });
    const patch = yield* Schema.decodeUnknown(LanceurPatchSchema)(rawPatch);
    const existing = yield* prisma.lanceurPhase.findFirst({
      where: { phaseId },
    });
    if (!existing) {
      return failure(LANCEUR_PHASE_NOT_FOUND_MESSAGE);
    }
    if (
      patch.etape &&
      !(yield* optionExists(prisma, LanceurOptionField.etape, patch.etape))
    ) {
      return failure(LANCEUR_UNKNOWN_OPTION_MESSAGE);
    }
    if (
      patch.installateur &&
      !(yield* optionExists(
        prisma,
        LanceurOptionField.installateur,
        patch.installateur,
      ))
    ) {
      return failure(LANCEUR_UNKNOWN_OPTION_MESSAGE);
    }
    const resetsApproval =
      patch.approvalDate !== undefined && patch.approvedOverride === undefined;
    const args: LanceurPhaseUpdateArgs = {
      where: { phaseId },
      data: {
        pdmDate: toDbDateOrNull(patch.pdmDate),
        approvalDate: toDbDateOrNull(patch.approvalDate),
        deliveryDate: toDbDateOrNull(patch.deliveryDate),
        price: patch.price,
        isSigned: patch.isSigned,
        isApproved: resetsApproval ? null : patch.approvedOverride,
        priority: patch.priority,
        etape: patch.etape,
        installateur: patch.installateur,
        deliveryComment:
          patch.deliveryComment === undefined
            ? undefined
            : normalizeStoredRichText(patch.deliveryComment),
        responsibleId: patch.responsibleId,
      },
    };
    yield* prisma.lanceurPhase.update(args);
    return OK;
  },
);

export const addLanceurPhaseEffect = Effect.fn("addLanceurPhase")(function* (
  prisma: PrismaService,
  phaseId: number,
) {
  yield* Effect.annotateLogsScoped({ phaseId });
  const phase = yield* prisma.projectPhase.findFirst({
    where: { id: phaseId, isDeleted: false, project: { isDeleted: false } },
  });
  if (!phase) {
    return failure(LANCEUR_PHASE_NOT_FOUND_MESSAGE);
  }
  const existing = yield* prisma.lanceurPhase.findFirst({ where: { phaseId } });
  if (existing) {
    return failure(LANCEUR_PHASE_ALREADY_ADDED_MESSAGE);
  }
  const last = yield* prisma.lanceurPhase.findFirst({
    orderBy: { priority: SortOrder.desc },
  });
  const args: LanceurPhaseCreateArgs = {
    data: { phaseId, priority: last ? last.priority + 1 : 1 },
  };
  yield* prisma.lanceurPhase.create(args);
  return OK;
});

export const removeLanceurPhaseEffect = Effect.fn("removeLanceurPhase")(
  function* (prisma: PrismaService, phaseId: number) {
    yield* Effect.annotateLogsScoped({ phaseId });
    yield* prisma.lanceurPhase.deleteMany({ where: { phaseId } });
  },
);

export const addLanceurOptionEffect = Effect.fn("addLanceurOption")(function* (
  prisma: PrismaService,
  rawInput: unknown,
) {
  const { field, value } = yield* Schema.decodeUnknown(
    LanceurOptionInputSchema,
  )(rawInput);
  if (yield* optionExists(prisma, field, value)) {
    return failure(LANCEUR_OPTION_EXISTS_MESSAGE);
  }
  const last = yield* prisma.lanceurOption.findFirst({
    where: { field },
    orderBy: { sortOrder: SortOrder.desc },
  });
  yield* prisma.lanceurOption.create({
    data: { field, value, sortOrder: last ? last.sortOrder + 1 : 0 },
  });
  return OK;
});

export const deleteLanceurOptionEffect = Effect.fn("deleteLanceurOption")(
  function* (prisma: PrismaService, optionId: number) {
    yield* prisma.lanceurOption.deleteMany({ where: { id: optionId } });
  },
);
