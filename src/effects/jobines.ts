import { Effect } from "effect";

import {
  JOBINE_ADDED_MESSAGE,
  JOBINE_ARCHIVED_MESSAGE,
  JOBINE_NOT_FOUND_MESSAGE,
  JOBINE_RESTORED_MESSAGE,
  JOBINE_SAVED_MESSAGE,
} from "@/constants/jobines";
import type { PrismaService } from "@/generated/effect-prisma";
import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import type {
  JobineCreateArgs,
  JobineFindManyArgs,
  JobineUpdateArgs,
  JobineWhereInput,
} from "@/generated/prisma/models";
import type {
  AddJobineFormData,
  EditJobineFormData,
  JobineFormState,
  JobineIdFormData,
} from "@/schemas/jobines.schemas";

const findJobines = Effect.fn("findJobines")(function* (
  prisma: PrismaService,
  where: JobineWhereInput,
) {
  const args: JobineFindManyArgs = {
    where,
    orderBy: { name: SortOrder.asc },
  };
  return yield* prisma.jobine.findMany(args);
});

export const getJobinesEffect = Effect.fn("getJobines")(function* (
  prisma: PrismaService,
) {
  return yield* findJobines(prisma, { isDeleted: false });
});

export const getAllJobinesEffect = Effect.fn("getAllJobines")(function* (
  prisma: PrismaService,
) {
  return yield* findJobines(prisma, {});
});

const updateJobine = Effect.fn("updateJobine")(function* (
  prisma: PrismaService,
  jobineId: number,
  data: JobineUpdateArgs["data"],
  message: string,
) {
  yield* Effect.annotateLogsScoped({ jobineId });
  const count = yield* prisma.jobine.count({ where: { id: jobineId } });
  if (count === 0) {
    return { errors: { jobineId: [JOBINE_NOT_FOUND_MESSAGE] } };
  }
  const args: JobineUpdateArgs = { where: { id: jobineId }, data };
  yield* prisma.jobine.update(args);
  return { message };
});

export const addJobineEffect = Effect.fn("addJobine")(function* (
  prisma: PrismaService,
  _formState: JobineFormState,
  { name, description, color }: AddJobineFormData,
) {
  const args: JobineCreateArgs = { data: { name, description, color } };
  const jobine = yield* prisma.jobine.create(args);
  yield* Effect.annotateLogsScoped({ jobineId: jobine.id });
  return { message: JOBINE_ADDED_MESSAGE };
});

export const editJobineEffect = Effect.fn("editJobine")(function* (
  prisma: PrismaService,
  _formState: JobineFormState,
  { jobineId, name, description, color }: EditJobineFormData,
) {
  return yield* updateJobine(
    prisma,
    jobineId,
    { name, description, color },
    JOBINE_SAVED_MESSAGE,
  );
});

export const archiveJobineEffect = Effect.fn("archiveJobine")(function* (
  prisma: PrismaService,
  _formState: JobineFormState,
  { jobineId }: JobineIdFormData,
) {
  return yield* updateJobine(
    prisma,
    jobineId,
    { isDeleted: true, deletedAt: new Date() },
    JOBINE_ARCHIVED_MESSAGE,
  );
});

export const restoreJobineEffect = Effect.fn("restoreJobine")(function* (
  prisma: PrismaService,
  _formState: JobineFormState,
  { jobineId }: JobineIdFormData,
) {
  return yield* updateJobine(
    prisma,
    jobineId,
    { isDeleted: false, deletedAt: null },
    JOBINE_RESTORED_MESSAGE,
  );
});
