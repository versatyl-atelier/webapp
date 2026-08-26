"use server";

import "server-only";

import { PrismaService } from "@/generated/effect-prisma";
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
    function* (
      formState: StartMultiPunchFormState,
      { employeeId, projectIds }: Record<string, FormDataEntryValue | null>,
    ) {
      return yield* Effect.gen(function* () {
        const prisma = yield* PrismaService;
        const id = parseInt(String(employeeId), 10);

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
        const now = new Date();

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
        Effect.catchTag("PunchAlreadyActiveError", () =>
          Effect.succeed({
            errors: {
              projectIds: ["Un punch est déjà actif"],
            },
          }),
        ),
      );
    },
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
    function* (
      formState: EndMultiPunchFormState,
      { employeeId, command }: Record<string, FormDataEntryValue | null>,
    ) {
      return yield* Effect.gen(function* () {
        const prisma = yield* PrismaService;
        const id = parseInt(String(employeeId), 10);

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

        const endTime = new Date();

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
        Effect.catchTag("NoActivePunchError", () =>
          Effect.succeed({
            errors: {
              command: ["Aucun punch actif"],
            },
          }),
        ),
      );
    },
    Role.employee,
  );
}

export const getActivePunch = cachedGetter(function* (employeeId: number) {
  const prisma = yield* PrismaService;
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
}, Role.employee);
