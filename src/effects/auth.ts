import { isAPIError } from "better-auth/api";
import { Effect } from "effect";
import { headers } from "next/headers";

import {
  CHANGE_PASSWORD_SUCCESS_MESSAGE,
  CREATE_USER_FAILED_MESSAGE,
  CREATE_USER_SUCCESS_MESSAGE,
  EMAIL_ALREADY_USED_MESSAGE,
  EMPLOYEE_REQUIRED_MESSAGE,
  EMPLOYEE_UNAVAILABLE_MESSAGE,
  INVALID_CREDENTIALS_MESSAGE,
  INVALID_CURRENT_PASSWORD_MESSAGE,
  INVALID_EMAIL_MESSAGE,
  LOGIN_SUCCESS_MESSAGE,
  LOGOUT_SUCCESS_MESSAGE,
  NAME_REQUIRED_MESSAGE,
  NO_EMPLOYEE_ID,
  PASSWORDS_DO_NOT_MATCH_MESSAGE,
} from "@/constants/auth";
import type { PrismaService } from "@/generated/effect-prisma";
import { Role } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { canAccessEmployee, hasAnyRole, toAppSession } from "@/lib/permissions";
import { getSession } from "@/lib/session";
import {
  AuthApiError,
  Forbidden,
  PasswordChangeRequired,
  SessionNotFound,
  type ChangePasswordFormState,
  type CreateUserFormState,
  type LoginFormState,
  type LogoutFormState,
} from "@/schemas/auth.schemas";

const authApi = <A>(call: () => Promise<A>) =>
  Effect.tryPromise({
    try: call,
    catch: (cause) =>
      new AuthApiError({
        code: isAPIError(cause) ? cause.body?.code : undefined,
        status: isAPIError(cause) ? cause.status : undefined,
        cause,
      }),
  });

const dieOnUnexpected = ({ code, cause }: AuthApiError) =>
  code ? Effect.void : Effect.die(cause);

export const requireSession = Effect.fn("requireSession")(function* () {
  const session = yield* Effect.tryPromise(getSession);
  if (!session) {
    return yield* new SessionNotFound();
  }
  yield* Effect.annotateLogsScoped({
    userId: session.userId,
    role: session.role,
  });
  return session;
});

export const getActiveSession = Effect.fn("getActiveSession")(function* () {
  const session = yield* requireSession();
  if (session.mustChangePassword) {
    return yield* new PasswordChangeRequired();
  }
  return session;
});

export const verifySession = Effect.fn("verifySession")(function* (
  roles: readonly Role[],
) {
  const session = yield* getActiveSession();
  if (!hasAnyRole(session.role, roles)) {
    return yield* new Forbidden({ roles });
  }
  return session;
});

export const assertEmployeeAccess = Effect.fn("assertEmployeeAccess")(
  function* (employeeId: number | null) {
    const session = yield* getActiveSession();
    if (!canAccessEmployee(session, employeeId)) {
      return yield* new Forbidden({ employeeId });
    }
    return session;
  },
);

export const loginEffect = Effect.fn("login")(
  function* (
    _prisma: PrismaService,
    _formState: LoginFormState,
    { email, password }: Record<string, FormDataEntryValue | null>,
  ) {
    const requestHeaders = yield* Effect.tryPromise(headers);
    const { user } = yield* authApi(() =>
      auth.api.signInEmail({
        body: { email: String(email), password: String(password) },
        headers: requestHeaders,
      }),
    );
    return {
      success: true,
      message: LOGIN_SUCCESS_MESSAGE,
      mustChangePassword: toAppSession(user)?.mustChangePassword ?? false,
    };
  },
  Effect.catchTag("AuthApiError", (error) =>
    Effect.zipRight(
      dieOnUnexpected(error),
      Effect.succeed({
        success: false,
        errors: { password: [INVALID_CREDENTIALS_MESSAGE] },
      }),
    ),
  ),
);

export const logoutEffect = Effect.fn("logout")(function* (
  _prisma: PrismaService,
  _formState: LogoutFormState,
  _formData: Record<string, FormDataEntryValue | null>,
) {
  const requestHeaders = yield* Effect.tryPromise(headers);
  yield* authApi(() => auth.api.signOut({ headers: requestHeaders })).pipe(
    Effect.catchTag("AuthApiError", dieOnUnexpected),
  );
  return { success: true, message: LOGOUT_SUCCESS_MESSAGE };
});

export const changePasswordEffect = Effect.fn("changePassword")(
  function* (
    prisma: PrismaService,
    _formState: ChangePasswordFormState,
    {
      currentPassword,
      newPassword,
      confirmPassword,
    }: Record<string, FormDataEntryValue | null>,
  ) {
    const session = yield* requireSession();
    if (newPassword !== confirmPassword) {
      return {
        errors: { confirmPassword: [PASSWORDS_DO_NOT_MATCH_MESSAGE] },
      };
    }
    const requestHeaders = yield* Effect.tryPromise(headers);
    yield* authApi(() =>
      auth.api.changePassword({
        body: {
          currentPassword: String(currentPassword),
          newPassword: String(newPassword),
          revokeOtherSessions: true,
        },
        headers: requestHeaders,
      }),
    );
    yield* prisma.user.update({
      where: { id: session.userId },
      data: { mustChangePassword: false },
    });
    return { message: CHANGE_PASSWORD_SUCCESS_MESSAGE };
  },
  Effect.catchTag("AuthApiError", (error) =>
    Effect.zipRight(
      dieOnUnexpected(error),
      Effect.succeed({
        errors: { currentPassword: [INVALID_CURRENT_PASSWORD_MESSAGE] },
      }),
    ),
  ),
);

const createUserErrors = (code: string | undefined) => {
  switch (code) {
    case auth.$ERROR_CODES.USER_ALREADY_EXISTS.code:
    case auth.$ERROR_CODES.USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL.code:
      return { email: [EMAIL_ALREADY_USED_MESSAGE] };
    case auth.$ERROR_CODES.INVALID_EMAIL.code:
      return { email: [INVALID_EMAIL_MESSAGE] };
    default:
      return { dataValidation: CREATE_USER_FAILED_MESSAGE };
  }
};

export const createUserEffect = Effect.fn("createUser")(
  function* (
    prisma: PrismaService,
    _formState: CreateUserFormState,
    {
      email,
      password,
      role,
      employeeId: strEmployeeId,
      name,
    }: Record<string, FormDataEntryValue | null>,
  ) {
    const hasEmployee = strEmployeeId !== NO_EMPLOYEE_ID;
    if (!hasEmployee && role === Role.employee) {
      return { errors: { employeeId: [EMPLOYEE_REQUIRED_MESSAGE] } };
    }

    let displayName = String(name).trim();
    let employeeId: number | undefined;
    if (hasEmployee) {
      const employee = yield* prisma.employee.findFirst({
        where: {
          id: parseInt(String(strEmployeeId), 10),
          isDeleted: false,
          user: null,
        },
        select: { id: true, name: true },
      });
      if (!employee) {
        return { errors: { employeeId: [EMPLOYEE_UNAVAILABLE_MESSAGE] } };
      }
      employeeId = employee.id;
      displayName = employee.name;
    }
    if (!displayName) {
      return { errors: { name: [NAME_REQUIRED_MESSAGE] } };
    }

    const requestHeaders = yield* Effect.tryPromise(headers);
    yield* authApi(() =>
      auth.api.createUser({
        body: {
          email: String(email),
          password: String(password),
          name: displayName,
          role: role as Role,
          data: { employeeId, mustChangePassword: true, emailVerified: true },
        },
        headers: requestHeaders,
      }),
    );
    return { message: CREATE_USER_SUCCESS_MESSAGE };
  },
  Effect.catchTag("AuthApiError", (error) =>
    Effect.zipRight(
      dieOnUnexpected(error),
      Effect.succeed({ errors: createUserErrors(error.code) }),
    ),
  ),
);
