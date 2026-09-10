import type { PrismaService } from "@/generated/effect-prisma";
import { ProjectType } from "@/generated/prisma/enums";
import { projectIdsToProjectData } from "@/lib/projects";
import { Effect } from "effect";
import {
  type EndMultiPunchFormState,
  type StartMultiPunchFormState,
  NoActivePunchError,
  PunchAlreadyActiveError,
} from "@/schemas/multiPunch.schemas";
import { assertWeekNotFrozen, handleWeekFrozen } from "@/effects/frozenWeeks";

export const startMultiPunchEffect = Effect.fn("startMultiPunch")(
  function* (
    prisma: PrismaService,
    _formState: StartMultiPunchFormState,
    { employeeId, projectIds }: Record<string, FormDataEntryValue | null>,
  ) {
    const id = parseInt(String(employeeId), 10);
    const now = new Date();
    yield* Effect.annotateLogsScoped({ employeeId: id });

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
  },
  Effect.catchTag("PunchAlreadyActiveError", () =>
    Effect.succeed({
      errors: {
        projectIds: ["Un punch est déjà actif"],
      },
    }),
  ),
  Effect.catchTag("WeekFrozenError", handleWeekFrozen),
);
export const endMultiPunchEffect = Effect.fn("endMultiPunch")(
  function* (
    prisma: PrismaService,
    _formState: EndMultiPunchFormState,
    { employeeId, command }: Record<string, FormDataEntryValue | null>,
  ) {
    const id = parseInt(String(employeeId), 10);
    const endTime = new Date();
    yield* Effect.annotateLogsScoped({ employeeId: id });

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
  },
  Effect.catchTag("NoActivePunchError", () =>
    Effect.succeed({
      errors: {
        command: ["Aucun punch actif"],
      },
    }),
  ),
  Effect.catchTag("WeekFrozenError", handleWeekFrozen),
);
export const getActivePunchEffect = Effect.fn("getActivePunch")(function* (
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
});
