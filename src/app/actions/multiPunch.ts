"use server";

import "server-only";

import { ProjectType, Role } from "@/generated/prisma/client";
import { parseItemKey } from "@/lib/itemKey";
import {
  type StartMultiPunchFormState,
  type EndMultiPunchFormState,
  StartMultiPunchSchema,
  EndMultiPunchSchema,
  EndMultiPunchFormErrors,
  StartMultiPunchFormErrors,
} from "./multiPunch.schemas";
import { runEffectAsFormAction } from "@/lib/effect";
import { Data, Effect } from "effect";
import { cachedGetter } from "@/lib/effect";
import type { PrismaService } from "@/generated/effect-prisma";
import {
  assertWeekNotFrozen,
  WEEK_FROZEN_MESSAGE,
} from "@/app/effects/frozenWeeks";

class PunchAlreadyActiveError extends Data.TaggedError(
  "PunchAlreadyActiveError",
)<{}> {}

class NoActivePunchError extends Data.TaggedError("NoActivePunchError")<{}> {}

function projectIdsToProjectData(projectIds: string[]) {
  return projectIds.map((projectId) => {
    const { type, id } = parseItemKey(projectId);
    const strId = id.toString();
    const isProject = type === ProjectType.trello;
    return {
      projectId: isProject ? strId : null,
      taskId: isProject ? null : parseInt(strId, 10),
      projectType: isProject ? ProjectType.trello : ProjectType.task,
    };
  });
}

export async function startMultiPunch(
  formState: StartMultiPunchFormState,
  formData: FormData,
): Promise<StartMultiPunchFormState> {
  return runEffectAsFormAction<
    StartMultiPunchFormState,
    typeof StartMultiPunchSchema,
    StartMultiPunchFormErrors
  >(
    formState,
    formData,
    StartMultiPunchSchema,
    Effect.fn("startMultiPunch")(function* (
      prisma: PrismaService,
      formState: StartMultiPunchFormState,
      { employeeId, projectIds }: Record<string, FormDataEntryValue | null>,
    ) {
      return yield* Effect.gen(function* () {
        const id = parseInt(String(employeeId), 10);
        const now = new Date();

        yield* assertWeekNotFrozen(prisma, id, now);

        const existingPunch = yield* prisma.timeEntry.findFirst({
          where: {
            employeeId: id,
            end: null,
            isDeleted: false,
          },
        });

        if (existingPunch) {
          return yield* new PunchAlreadyActiveError();
        }

        const projectData = projectIdsToProjectData(
          Array.isArray(projectIds) ? projectIds : [],
        );

        yield* prisma.$transaction(
          Effect.gen(function* () {
            for (const project of projectData) {
              const timeEntry = yield* prisma.timeEntry.create({
                data: {
                  employeeId: id,
                  start: now,
                  end: null,
                  subtaskId:
                    project.projectType === ProjectType.trello
                      ? "1default"
                      : undefined,
                  entryMethod: "punch",
                },
              });

              yield* prisma.timeEntryProject.create({
                data: {
                  timeEntryId: timeEntry.id,
                  projectType: project.projectType,
                  projectId: project.projectId,
                  taskId: project.taskId,
                },
              });
            }
          }),
        );

        return {
          message: "Punch démarré",
        };
      }).pipe(
        Effect.catchTags({
          PunchAlreadyActiveError: () =>
            Effect.succeed({
              errors: {
                projectIds: ["Un punch est déjà actif"],
              },
            }),
          WeekFrozenError: () =>
            Effect.succeed({
              errors: { dataValidation: WEEK_FROZEN_MESSAGE },
            }),
        }),
      );
    }),
    Role.employee,
  );
}

export async function endMultiPunch(
  formState: EndMultiPunchFormState,
  formData: FormData,
): Promise<EndMultiPunchFormState> {
  return runEffectAsFormAction<
    EndMultiPunchFormState,
    typeof EndMultiPunchSchema,
    EndMultiPunchFormErrors
  >(
    formState,
    formData,
    EndMultiPunchSchema,
    Effect.fn("endMultiPunch")(function* (
      prisma: PrismaService,
      formState: EndMultiPunchFormState,
      { employeeId, command }: Record<string, FormDataEntryValue | null>,
    ) {
      return yield* Effect.gen(function* () {
        const id = parseInt(String(employeeId), 10);
        const endTime = new Date();

        yield* assertWeekNotFrozen(prisma, id, endTime);

        const activePunches = yield* prisma.timeEntry.findMany({
          where: {
            employeeId: id,
            end: null,
            isDeleted: false,
          },
        });

        if (activePunches.length === 0) {
          return yield* new NoActivePunchError();
        }

        if (command === "cancel") {
          yield* prisma.timeEntry.updateMany({
            where: {
              employeeId: id,
              end: null,
              isDeleted: false,
            },
            data: {
              isDeleted: true,
              deletedAt: endTime,
            },
          });

          return {
            message: "Punch annulé",
          };
        }

        yield* prisma.timeEntry.updateMany({
          where: {
            employeeId: id,
            end: null,
            isDeleted: false,
          },
          data: {
            end: endTime,
          },
        });

        return {
          message: "Punch terminé",
        };
      }).pipe(
        Effect.catchTags({
          NoActivePunchError: () =>
            Effect.succeed({
              errors: {
                command: ["Aucun punch actif"],
              },
            }),
          WeekFrozenError: () =>
            Effect.succeed({
              errors: { dataValidation: WEEK_FROZEN_MESSAGE },
            }),
        }),
      );
    }),
    Role.employee,
  );
}

export const getActivePunch = cachedGetter(
  Effect.fn("getActivePunch")(function* (
    prisma: PrismaService,
    employeeId: number,
  ) {
    const activePunches = yield* prisma.timeEntry.findMany({
      where: {
        employeeId,
        end: null,
        isDeleted: false,
      },
      include: {
        projects: {
          include: {
            project: {
              select: { name: true },
            },
            task: {
              select: { name: true },
            },
          },
        },
      },
    });
    return activePunches.length > 0
      ? {
          startTime: activePunches[0].start,
          activePunchProjects: activePunches[0].projects,
        }
      : null;
  }),
  Role.employee,
);
