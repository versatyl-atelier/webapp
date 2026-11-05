import { Effect, Schema } from "effect";

import { PLAN_SETTING_KEYS } from "@/constants/lanceurPlan";
import {
  CLOSURE_ADDED_MESSAGE,
  CLOSURE_EXISTS_MESSAGE,
  SETTINGS_SAVED_MESSAGE,
  SETTING_DESCRIPTIONS,
  SETTING_TYPE_NUMBER,
} from "@/constants/lanceurSettings";
import type { PrismaService } from "@/generated/effect-prisma";
import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import { toDateKey, toDbDate } from "@/lib/calendar";
import {
  ClosureIdSchema,
  type ClosureFormData,
  type ClosureFormState,
  type PlanSettingsFormData,
  type PlanSettingsFormState,
} from "@/schemas/lanceurSettings.schemas";

export const getClosuresEffect = Effect.fn("getClosures")(function* (
  prisma: PrismaService,
) {
  const closures = yield* prisma.shopClosure.findMany({
    orderBy: { closureDate: SortOrder.asc },
  });
  return closures.map(({ id, closureDate, reason }) => ({
    id,
    date: toDateKey(closureDate),
    reason: reason ?? "",
  }));
});

const saveSetting = Effect.fn("saveSetting")(function* (
  prisma: PrismaService,
  key: string,
  value: number,
  description: string,
) {
  yield* prisma.setting.upsert({
    where: { key },
    create: {
      key,
      value: String(value),
      type: SETTING_TYPE_NUMBER,
      description,
    },
    update: { value: String(value) },
  });
});

export const savePlanSettingsEffect = Effect.fn("savePlanSettings")(function* (
  prisma: PrismaService,
  _formState: PlanSettingsFormState,
  { capacityRatio, minProdDays, maxWeekShare }: PlanSettingsFormData,
) {
  yield* prisma.$transaction(
    Effect.gen(function* () {
      yield* saveSetting(
        prisma,
        PLAN_SETTING_KEYS.capacityRatio,
        capacityRatio,
        SETTING_DESCRIPTIONS.shopCapacityRatio,
      );
      yield* saveSetting(
        prisma,
        PLAN_SETTING_KEYS.minProdDays,
        minProdDays,
        SETTING_DESCRIPTIONS.availMinProdDays,
      );
      yield* saveSetting(
        prisma,
        PLAN_SETTING_KEYS.maxWeekShare,
        maxWeekShare,
        SETTING_DESCRIPTIONS.availMaxWeekShare,
      );
    }),
  );
  return { message: SETTINGS_SAVED_MESSAGE };
});

export const addClosureEffect = Effect.fn("addClosure")(function* (
  prisma: PrismaService,
  _formState: ClosureFormState,
  { date, reason }: ClosureFormData,
) {
  const closureDate = toDbDate(date);
  const existing = yield* prisma.shopClosure.findFirst({
    where: { closureDate },
  });
  if (existing) {
    return { errors: { date: [CLOSURE_EXISTS_MESSAGE] } };
  }
  yield* prisma.shopClosure.create({
    data: { closureDate, reason: reason === "" ? null : reason },
  });
  return { message: CLOSURE_ADDED_MESSAGE };
});

export const removeClosureEffect = Effect.fn("removeClosure")(function* (
  prisma: PrismaService,
  rawId: unknown,
) {
  const id = yield* Schema.decodeUnknown(ClosureIdSchema)(rawId);
  yield* Effect.annotateLogsScoped({ closureId: id });
  yield* prisma.shopClosure.deleteMany({ where: { id } });
});
