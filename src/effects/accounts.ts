import { Effect } from "effect";
import { headers } from "next/headers";

import {
  ACCOUNT_OWNS_EVENTS_MESSAGE,
  ACCOUNT_REMOVED_MESSAGE,
  ARCHIVE_SELF_MESSAGE,
  ARCHIVED_BAN_REASON,
  EMAIL_LOCKED_MESSAGE,
  NO_STATUT_ID,
  PASSWORD_RESET_FAILED_MESSAGE,
  PASSWORD_RESET_MESSAGE,
  PERSON_ARCHIVED_MESSAGE,
  PERSON_NOT_FOUND_MESSAGE,
  PERSON_SAVED_MESSAGE,
  REMOVE_SELF_MESSAGE,
  RESET_SELF_MESSAGE,
  ROLE_NOT_ASSIGNABLE_MESSAGE,
  ROLE_SELF_MESSAGE,
  STATUT_NOT_FOUND_MESSAGE,
} from "@/constants/accounts";
import { EMAIL_ALREADY_USED_MESSAGE } from "@/constants/auth";
import type { PrismaService } from "@/generated/effect-prisma";
import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import type {
  EmployeeFindFirstArgs,
  EmployeeFindManyArgs,
  CalendarEventCountArgs,
  EmployeeUpdateArgs,
  SessionDeleteManyArgs,
  StatutFindFirstArgs,
  StatutFindManyArgs,
  UserDeleteArgs,
  UserFindManyArgs,
  UserFindUniqueArgs,
  UserUpdateArgs,
} from "@/generated/prisma/models";
import { auth } from "@/lib/auth";
import {
  assignableRoles,
  buildPeople,
  newTemporaryPassword,
} from "@/lib/accounts";
import { authApi, dieOnUnexpected, getActiveSession } from "@/effects/auth";
import type {
  AccountFormState,
  ArchiveEmployeeFormData,
  EditPersonFormData,
  UserIdFormData,
} from "@/schemas/accounts.schemas";

const userSelect = {
  id: true,
  email: true,
  role: true,
  mustChangePassword: true,
} as const;

export const getPeopleEffect = Effect.fn("getPeople")(function* (
  prisma: PrismaService,
) {
  const employeeArgs = {
    where: { isDeleted: false },
    select: {
      id: true,
      name: true,
      displayOrder: true,
      statut: { select: { id: true, description: true } },
      user: { select: userSelect },
    },
  } satisfies EmployeeFindManyArgs;
  const userArgs = {
    where: { employeeId: null },
    select: { ...userSelect, name: true },
    orderBy: { name: SortOrder.asc },
  } satisfies UserFindManyArgs;
  const [employees, users] = yield* Effect.all([
    prisma.employee.findMany(employeeArgs),
    prisma.user.findMany(userArgs),
  ]);
  return buildPeople(employees, users);
});

export const getStatutsEffect = Effect.fn("getStatuts")(function* (
  prisma: PrismaService,
) {
  const args = {
    where: { isDeleted: false },
    select: { id: true, description: true },
    orderBy: { description: SortOrder.asc },
  } satisfies StatutFindManyArgs;
  return yield* prisma.statut.findMany(args);
});

export const editPersonEffect = Effect.fn("editPerson")(function* (
  prisma: PrismaService,
  _formState: AccountFormState,
  {
    employeeId,
    userId,
    name,
    statutId,
    displayOrder,
    email,
    role,
  }: EditPersonFormData,
) {
  yield* Effect.annotateLogsScoped({ employeeId, userId });
  const session = yield* getActiveSession();
  const notFound = { errors: { dataValidation: PERSON_NOT_FOUND_MESSAGE } };
  if (employeeId === undefined && userId === undefined) {
    return notFound;
  }

  if (employeeId !== undefined) {
    const employeeArgs: EmployeeFindFirstArgs = {
      where: { id: employeeId, isDeleted: false },
      select: { id: true },
    };
    if (!(yield* prisma.employee.findFirst(employeeArgs))) {
      return notFound;
    }
  }

  const nextStatutId = statutId === NO_STATUT_ID ? null : statutId;
  if (nextStatutId) {
    const statutArgs: StatutFindFirstArgs = {
      where: { id: nextStatutId, isDeleted: false },
      select: { id: true },
    };
    if (!(yield* prisma.statut.findFirst(statutArgs))) {
      return { errors: { statutId: [STATUT_NOT_FOUND_MESSAGE] } };
    }
  }

  const nextEmail = email?.toLowerCase();
  if (userId !== undefined) {
    const userArgs: UserFindUniqueArgs = {
      where: { id: userId },
      select: {
        email: true,
        role: true,
        employeeId: true,
        mustChangePassword: true,
      },
    };
    const user = yield* prisma.user.findUnique(userArgs);
    if (!user || (user.employeeId ?? undefined) !== employeeId) {
      return notFound;
    }
    if (role !== undefined && role !== user.role) {
      if (userId === session.userId) {
        return { errors: { role: [ROLE_SELF_MESSAGE] } };
      }
      if (!assignableRoles(user.employeeId !== null).includes(role)) {
        return { errors: { role: [ROLE_NOT_ASSIGNABLE_MESSAGE] } };
      }
    }
    if (nextEmail !== undefined && nextEmail !== user.email) {
      if (!user.mustChangePassword) {
        return { errors: { email: [EMAIL_LOCKED_MESSAGE] } };
      }
      const takenArgs: UserFindUniqueArgs = {
        where: { email: nextEmail },
        select: { id: true },
      };
      if (yield* prisma.user.findUnique(takenArgs)) {
        return { errors: { email: [EMAIL_ALREADY_USED_MESSAGE] } };
      }
    }
  }

  yield* prisma.$transaction(
    Effect.gen(function* () {
      if (employeeId !== undefined) {
        const args: EmployeeUpdateArgs = {
          where: { id: employeeId },
          data: { name, statutId: nextStatutId, displayOrder },
        };
        yield* prisma.employee.update(args);
      }
      if (userId !== undefined) {
        const args: UserUpdateArgs = {
          where: { id: userId },
          data: {
            name,
            email: nextEmail,
            role,
          },
        };
        yield* prisma.user.update(args);
      }
    }),
  );
  return { message: PERSON_SAVED_MESSAGE };
});

export const archiveEmployeeEffect = Effect.fn("archiveEmployee")(function* (
  prisma: PrismaService,
  _formState: AccountFormState,
  { employeeId }: ArchiveEmployeeFormData,
) {
  yield* Effect.annotateLogsScoped({ employeeId });
  const session = yield* getActiveSession();
  const findArgs = {
    where: { id: employeeId, isDeleted: false },
    select: { user: { select: { id: true } } },
  } satisfies EmployeeFindFirstArgs;
  const employee = yield* prisma.employee.findFirst(findArgs);
  if (!employee) {
    return { errors: { employeeId: [PERSON_NOT_FOUND_MESSAGE] } };
  }
  const userId = employee.user?.id;
  if (userId === session.userId) {
    return { errors: { employeeId: [ARCHIVE_SELF_MESSAGE] } };
  }

  yield* prisma.$transaction(
    Effect.gen(function* () {
      const archiveArgs: EmployeeUpdateArgs = {
        where: { id: employeeId },
        data: { isDeleted: true, deletedAt: new Date() },
      };
      yield* prisma.employee.update(archiveArgs);
      if (userId) {
        const banArgs: UserUpdateArgs = {
          where: { id: userId },
          data: { banned: true, banReason: ARCHIVED_BAN_REASON },
        };
        const sessionsArgs: SessionDeleteManyArgs = { where: { userId } };
        yield* prisma.user.update(banArgs);
        yield* prisma.session.deleteMany(sessionsArgs);
      }
    }),
  );
  return { message: PERSON_ARCHIVED_MESSAGE };
});

export const resetPasswordEffect = Effect.fn("resetPassword")(
  function* (
    prisma: PrismaService,
    _formState: AccountFormState,
    { userId }: UserIdFormData,
  ) {
    yield* Effect.annotateLogsScoped({ userId });
    const session = yield* getActiveSession();
    if (userId === session.userId) {
      return { errors: { userId: [RESET_SELF_MESSAGE] } };
    }
    const userArgs: UserFindUniqueArgs = {
      where: { id: userId },
      select: { id: true },
    };
    if (!(yield* prisma.user.findUnique(userArgs))) {
      return { errors: { userId: [PERSON_NOT_FOUND_MESSAGE] } };
    }

    const temporaryPassword = newTemporaryPassword();
    const requestHeaders = yield* Effect.tryPromise(headers);
    yield* authApi(() =>
      auth.api.setUserPassword({
        body: { userId, newPassword: temporaryPassword },
        headers: requestHeaders,
      }),
    );
    const flagArgs: UserUpdateArgs = {
      where: { id: userId },
      data: { mustChangePassword: true },
    };
    const sessionsArgs: SessionDeleteManyArgs = { where: { userId } };
    yield* prisma.$transaction(
      Effect.gen(function* () {
        yield* prisma.user.update(flagArgs);
        yield* prisma.session.deleteMany(sessionsArgs);
      }),
    );
    return { message: PASSWORD_RESET_MESSAGE, temporaryPassword };
  },
  Effect.catchTag("AuthApiError", (error) =>
    Effect.zipRight(
      dieOnUnexpected(error),
      Effect.succeed({
        errors: { dataValidation: PASSWORD_RESET_FAILED_MESSAGE },
      }),
    ),
  ),
);

export const removeAccountEffect = Effect.fn("removeAccount")(function* (
  prisma: PrismaService,
  _formState: AccountFormState,
  { userId }: UserIdFormData,
) {
  yield* Effect.annotateLogsScoped({ userId });
  const session = yield* getActiveSession();
  if (userId === session.userId) {
    return { errors: { userId: [REMOVE_SELF_MESSAGE] } };
  }
  const userArgs: UserFindUniqueArgs = {
    where: { id: userId },
    select: { id: true },
  };
  if (!(yield* prisma.user.findUnique(userArgs))) {
    return { errors: { userId: [PERSON_NOT_FOUND_MESSAGE] } };
  }
  const eventsArgs: CalendarEventCountArgs = { where: { ownerId: userId } };
  if ((yield* prisma.calendarEvent.count(eventsArgs)) > 0) {
    return { errors: { userId: [ACCOUNT_OWNS_EVENTS_MESSAGE] } };
  }
  const deleteArgs: UserDeleteArgs = { where: { id: userId } };
  yield* prisma.user.delete(deleteArgs);
  return { message: ACCOUNT_REMOVED_MESSAGE };
});
