import { Effect, Schema } from "effect";

import {
  LANCEUR_OPTION_EXISTS_MESSAGE,
  LANCEUR_PHASE_ALREADY_ADDED_MESSAGE,
  LANCEUR_PHASE_NOT_FOUND_MESSAGE,
  LANCEUR_UNKNOWN_OPTION_MESSAGE,
} from "@/constants/lanceur";
import {
  INTAKE_DUPLICATE_MESSAGE,
  INTAKE_PROJECT_HAS_PHASES_MESSAGE,
} from "@/constants/lanceurIntake";
import type { PrismaService } from "@/generated/effect-prisma";
import { LanceurOptionField } from "@/generated/prisma/enums";
import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import type {
  EmployeeFindManyArgs,
  LanceurOptionFindManyArgs,
  LanceurPhaseCreateArgs,
  LanceurPhaseFindManyArgs,
  LanceurPhaseUpdateArgs,
} from "@/generated/prisma/models";
import { getActiveSession } from "@/effects/auth";
import { toDateKey, toDbDate } from "@/lib/calendar";
import { trackedChanges } from "@/lib/lanceurEdit";
import {
  PLAN_DEFAULT_CAPACITY_RATIO,
  PLAN_DEFAULT_MAX_WEEK_SHARE,
  PLAN_DEFAULT_MIN_PROD_DAYS,
  PLAN_SETTING_KEYS,
} from "@/constants/lanceurPlan";
import type { LanceurLogEntry, LanceurRow } from "@/lib/lanceur";
import { intakeSlots, slotKey, type IntakeProject } from "@/lib/lanceurIntake";
import { phaseName } from "@/lib/projects";
import type { PlanSettings } from "@/lib/lanceurPlan";
import { normalizeStoredRichText } from "@/lib/richText";
import {
  LanceurAddTargetSchema,
  LanceurImportSchema,
  LanceurOptionInputSchema,
  LanceurPatchSchema,
  PhaseIdSchema,
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

export const getImportableProjectsEffect = Effect.fn("getImportableProjects")(
  function* (prisma: PrismaService) {
    const projects = yield* prisma.project.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        name: true,
        color: true,
        phases: {
          where: { isDeleted: false },
          select: {
            id: true,
            name: true,
            lanceur: { select: { phaseId: true } },
          },
          orderBy: [{ sortOrder: SortOrder.asc }, { id: SortOrder.asc }],
        },
      },
      orderBy: { name: SortOrder.asc },
    });
    return projects.flatMap(({ id, name, color, phases }): IntakeProject[] => {
      const slots = intakeSlots(
        id,
        phases.map((phase) => ({
          id: phase.id,
          name: phase.name,
          isInLanceur: phase.lanceur !== null,
        })),
      );
      return slots.length > 0 ? [{ id, name, color, slots }] : [];
    });
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
    const session = yield* getActiveSession();
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
    const changes = trackedChanges(
      {
        price: existing.price,
        pdmDate: existing.pdmDate ? toDateKey(existing.pdmDate) : null,
        approvalDate: existing.approvalDate
          ? toDateKey(existing.approvalDate)
          : null,
        deliveryDate: existing.deliveryDate
          ? toDateKey(existing.deliveryDate)
          : null,
      },
      patch,
    );
    const createdAt = new Date();
    yield* prisma.$transaction(
      Effect.gen(function* () {
        yield* prisma.lanceurPhase.update(args);
        if (changes.length > 0) {
          yield* prisma.lanceurLog.createMany({
            data: changes.map((change) => ({
              ...change,
              phaseId,
              userId: session.userId,
              createdAt,
            })),
          });
        }
      }),
    );
    return OK;
  },
);

export const getLanceurLogEffect = Effect.fn("getLanceurLog")(function* (
  prisma: PrismaService,
  rawPhaseId: unknown,
) {
  const phaseId = yield* Schema.decodeUnknown(PhaseIdSchema)(rawPhaseId);
  const logs = yield* prisma.lanceurLog.findMany({
    where: { phaseId },
    include: { user: { select: { name: true } } },
    orderBy: [{ createdAt: SortOrder.desc }, { id: SortOrder.desc }],
  });
  return logs.map((log): LanceurLogEntry => ({
    id: log.id,
    field: log.field,
    oldValue: log.oldValue,
    newValue: log.newValue,
    createdAt: log.createdAt.toISOString(),
    userName: log.user?.name ?? null,
  }));
});

type NewLanceurEntry = {
  projectId: string;
  phaseId: number | null;
  price?: number;
  pdmDate?: string | null;
  approvalDate?: string | null;
  deliveryDate?: string | null;
  etape?: string;
  installateur?: string;
  responsibleId?: number | null;
};

const validateNewEntries = Effect.fn("validateNewEntries")(function* (
  prisma: PrismaService,
  entries: readonly NewLanceurEntry[],
) {
  const seen = new Set<string>();
  for (const entry of entries) {
    const key = slotKey(entry.projectId, entry.phaseId);
    if (seen.has(key)) {
      return INTAKE_DUPLICATE_MESSAGE;
    }
    seen.add(key);
    const project = yield* prisma.project.findFirst({
      where: { id: entry.projectId, isDeleted: false },
      select: {
        phases: {
          where: { isDeleted: false },
          select: { id: true, lanceur: { select: { phaseId: true } } },
        },
      },
    });
    if (!project) {
      return LANCEUR_PHASE_NOT_FOUND_MESSAGE;
    }
    if (entry.phaseId === null) {
      if (project.phases.length > 0) {
        return INTAKE_PROJECT_HAS_PHASES_MESSAGE;
      }
    } else {
      const phase = project.phases.find(({ id }) => id === entry.phaseId);
      if (!phase) {
        return LANCEUR_PHASE_NOT_FOUND_MESSAGE;
      }
      if (phase.lanceur) {
        return LANCEUR_PHASE_ALREADY_ADDED_MESSAGE;
      }
    }
    if (
      entry.etape &&
      !(yield* optionExists(prisma, LanceurOptionField.etape, entry.etape))
    ) {
      return LANCEUR_UNKNOWN_OPTION_MESSAGE;
    }
    if (
      entry.installateur &&
      !(yield* optionExists(
        prisma,
        LanceurOptionField.installateur,
        entry.installateur,
      ))
    ) {
      return LANCEUR_UNKNOWN_OPTION_MESSAGE;
    }
  }
  return null;
});

const createFirstPhase = Effect.fn("createFirstPhase")(function* (
  prisma: PrismaService,
  projectId: string,
) {
  const first = yield* prisma.projectPhase.create({
    data: { projectId, name: phaseName(1), sortOrder: 0 },
    select: { id: true },
  });
  yield* prisma.projectPiece.updateMany({
    where: { projectId, phaseId: null },
    data: { phaseId: first.id },
  });
  return first.id;
});

const createNewEntries = Effect.fn("createNewEntries")(function* (
  prisma: PrismaService,
  entries: readonly NewLanceurEntry[],
) {
  const last = yield* prisma.lanceurPhase.findFirst({
    orderBy: { priority: SortOrder.desc },
  });
  let priority = last ? last.priority : 0;
  yield* prisma.$transaction(
    Effect.gen(function* () {
      for (const entry of entries) {
        priority += 1;
        const phaseId =
          entry.phaseId ?? (yield* createFirstPhase(prisma, entry.projectId));
        const args: LanceurPhaseCreateArgs = {
          data: {
            phaseId,
            priority,
            price: entry.price,
            pdmDate: toDbDateOrNull(entry.pdmDate),
            approvalDate: toDbDateOrNull(entry.approvalDate),
            deliveryDate: toDbDateOrNull(entry.deliveryDate),
            etape: entry.etape,
            installateur: entry.installateur,
            responsibleId: entry.responsibleId,
          },
        };
        yield* prisma.lanceurPhase.create(args);
      }
    }),
  );
});

const addNewEntries = Effect.fn("addNewEntries")(function* (
  prisma: PrismaService,
  entries: readonly NewLanceurEntry[],
) {
  const error = yield* validateNewEntries(prisma, entries);
  if (error) {
    return failure(error);
  }
  yield* createNewEntries(prisma, entries);
  return OK;
});

export const addLanceurPhaseEffect = Effect.fn("addLanceurPhase")(function* (
  prisma: PrismaService,
  rawTarget: unknown,
) {
  const target = yield* Schema.decodeUnknown(LanceurAddTargetSchema)(rawTarget);
  yield* Effect.annotateLogsScoped({ projectId: target.projectId });
  return yield* addNewEntries(prisma, [target]);
});

export const importLanceurPhasesEffect = Effect.fn("importLanceurPhases")(
  function* (prisma: PrismaService, rawEntries: unknown) {
    const entries =
      yield* Schema.decodeUnknown(LanceurImportSchema)(rawEntries);
    yield* Effect.annotateLogsScoped({ importedPhases: entries.length });
    return yield* addNewEntries(prisma, entries);
  },
);

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

function positiveSetting(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const getPlanSettingsEffect = Effect.fn("getPlanSettings")(function* (
  prisma: PrismaService,
) {
  const [settings, closures] = yield* Effect.all(
    [
      prisma.setting.findMany({
        where: { key: { in: Object.values(PLAN_SETTING_KEYS) } },
      }),
      prisma.shopClosure.findMany({
        select: { closureDate: true },
        orderBy: { closureDate: SortOrder.asc },
      }),
    ],
    { concurrency: "unbounded" },
  );
  const values = new Map(settings.map(({ key, value }) => [key, value]));
  return {
    capacityRatio: positiveSetting(
      values.get(PLAN_SETTING_KEYS.capacityRatio),
      PLAN_DEFAULT_CAPACITY_RATIO,
    ),
    minProdDays: positiveSetting(
      values.get(PLAN_SETTING_KEYS.minProdDays),
      PLAN_DEFAULT_MIN_PROD_DAYS,
    ),
    maxWeekShare: positiveSetting(
      values.get(PLAN_SETTING_KEYS.maxWeekShare),
      PLAN_DEFAULT_MAX_WEEK_SHARE,
    ),
    closures: closures.map(({ closureDate }) => toDateKey(closureDate)),
  } satisfies PlanSettings;
});
