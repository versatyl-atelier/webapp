"use server";

import "server-only";

import prisma from "@/lib/prisma";
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
import { Effect } from "effect";
import { cachedGetter } from "@/lib/effect";

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
    (
      formState: StartMultiPunchFormState,
      { employeeId, projectIds }: Record<string, FormDataEntryValue | null>,
    ) =>
      Effect.gen(function* () {
        const id = parseInt(String(employeeId), 10);

        const existingPunch = yield* Effect.tryPromise(() =>
          prisma.timeEntry.findFirst({
            where: {
              employeeId: id,
              end: null,
              isDeleted: false,
            },
          }),
        );

        if (existingPunch) {
          return {
            errors: {
              projectIds: ["Un punch est déjà actif"],
            },
          };
        }

        const projectData = projectIdsToProjectData(
          Array.isArray(projectIds) ? projectIds : [],
        );
        const now = new Date();

        for (const project of projectData) {
          console.log({ id });
          const timeEntry = yield* Effect.tryPromise(() =>
            prisma.timeEntry.create({
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
            }),
          );

          yield* Effect.tryPromise(() =>
            prisma.timeEntryProject.create({
              data: {
                timeEntryId: timeEntry.id,
                projectType: project.projectType,
                projectId: project.projectId,
                taskId: project.taskId,
              },
            }),
          );
        }

        return {
          message: "Punch démarré",
        };
      }).pipe(
        Effect.catchAll((error) => {
          console.error(error);
          return Effect.succeed({
            errors: {
              projectIds: ["Erreur lors du démarrage du punch"],
            },
          });
        }),
      ),
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
    (
      formState: EndMultiPunchFormState,
      { employeeId, command }: Record<string, FormDataEntryValue | null>,
    ) =>
      Effect.gen(function* () {
        const id = parseInt(String(employeeId), 10);

        const activePunches = yield* Effect.tryPromise(() =>
          prisma.timeEntry.findMany({
            where: {
              employeeId: id,
              end: null,
              isDeleted: false,
            },
          }),
        );

        if (activePunches.length === 0) {
          return {
            errors: {
              command: ["Aucun punch actif"],
            },
          };
        }

        const endTime = new Date();

        if (command === "cancel") {
          yield* Effect.tryPromise(() =>
            prisma.timeEntry.updateMany({
              where: {
                employeeId: id,
                end: null,
                isDeleted: false,
              },
              data: {
                isDeleted: true,
                deletedAt: endTime,
              },
            }),
          );

          return {
            message: "Punch annulé",
          };
        }

        yield* Effect.tryPromise(() =>
          prisma.timeEntry.updateMany({
            where: {
              employeeId: id,
              end: null,
              isDeleted: false,
            },
            data: {
              end: endTime,
            },
          }),
        );

        return {
          message: "Punch terminé",
        };
      }).pipe(
        Effect.catchAll((error) => {
          console.error(error);
          return Effect.succeed({
            errors: {
              command: ["Erreur lors de la fermeture du punch"],
            },
          });
        }),
      ),
  );
}

export const getActivePunch = cachedGetter((employeeId: number) =>
  Effect.gen(function* () {
    const activePunches = yield* Effect.tryPromise(() =>
      prisma.timeEntry.findMany({
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
      }),
    );
    return activePunches.length > 0
      ? {
          startTime: activePunches[0].start,
          activePunchProjects: activePunches[0].projects,
        }
      : null;
  }),
);
