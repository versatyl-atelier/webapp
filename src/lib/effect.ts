import "server-only";

import { Effect } from "effect";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { verifySession } from "@/effects/auth";
import {
  Forbidden,
  PasswordChangeRequired,
  SessionNotFound,
} from "@/schemas/auth.schemas";
import {
  FIBER_FAILURE_NAME_PREFIX,
  FORBIDDEN_MESSAGE,
  PASSWORD_CHANGE_REQUIRED_ERROR,
  SESSION_NOT_FOUND_ERROR,
} from "@/constants/auth";
import { changePasswordPath, loginPath } from "@/lib/paths";
import { Role } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import {
  PrismaConnectionError,
  PrismaService,
} from "@/generated/effect-prisma";
import { PrismaLayer } from "@/lib/prisma";
import { toErrorMessage } from "@/lib/prismaErrors";
import {
  LoggingLayer,
  requestIdFromHeaders,
  withWideEvent,
} from "@/lib/logging";
import { ParseResult, Schema } from "effect";

function recoverPrismaConnectionDefects<A, E, R>(
  effect: Effect.Effect<A, E, R>,
  operation: string,
): Effect.Effect<A, E | PrismaConnectionError, R> {
  return effect.pipe(
    Effect.catchAllDefect((defect) => {
      if (
        defect instanceof Prisma.PrismaClientKnownRequestError &&
        defect.code === "ECONNREFUSED"
      ) {
        return Effect.fail(
          new PrismaConnectionError({
            cause: defect,
            operation,
            model: (defect?.meta?.modelName as string) || "unknown",
          }),
        );
      }
      return Effect.die(defect);
    }),
  );
}

export function cachedGetter<T, E, R>(
  getEffect: (prisma: PrismaService, ...args: any) => Effect.Effect<T, E, R>,
  roles?: readonly Role[],
  redirectTo?: string,
) {
  return cache(protectedEffect<T, E, R>(getEffect, roles, "read", redirectTo));
}

export function protectedEffect<T, E, R>(
  getEffect: (prisma: PrismaService, ...args: any) => Effect.Effect<T, E, R>,
  roles?: readonly Role[],
  kind: "read" | "mutation" = "read",
  redirectTo?: string,
) {
  return async (...args: any) => {
    const headersList = await headers();
    const requestId = requestIdFromHeaders(headersList);
    const operation = getEffect.name || "unnamed protected effect";
    const name = operation;

    try {
      return await Effect.runPromise(
        withWideEvent(
          recoverPrismaConnectionDefects(
            Effect.gen(function* () {
              if (roles) {
                yield* verifySession(roles);
              }
              const prisma = yield* PrismaService;
              return yield* getEffect(prisma, ...args);
            }),
            operation,
          ),
          {
            message: "Protected action",
            kind,
            requestId,
            roles,
            name,
            defaultLogLevel: kind === "mutation" ? "Info" : "Debug",
          },
        ).pipe(
          Effect.provide(PrismaLayer),
          Effect.provide(LoggingLayer),
        ) as Effect.Effect<T, E, never>,
      );
    } catch (error) {
      return handleAuthFailure(error, redirectTo);
    }
  };
}

function isFailureTagged(error: unknown, tag: string) {
  return (
    error instanceof Error &&
    error.name === `${FIBER_FAILURE_NAME_PREFIX}${tag}`
  );
}

function handleAuthFailure(error: unknown, redirectTo?: string): never {
  if (isFailureTagged(error, SESSION_NOT_FOUND_ERROR)) {
    redirect(loginPath(redirectTo));
  }
  if (isFailureTagged(error, PASSWORD_CHANGE_REQUIRED_ERROR)) {
    redirect(changePasswordPath(redirectTo));
  }
  if (isFailureTagged(error, "Forbidden")) {
    notFound();
  }
  throw error;
}

export function runEffectAsFormAction<
  FormState,
  FormSchema extends Schema.Schema<any, any, never>,
  FormErrors,
>(
  formState: FormState,
  formData: FormData,
  formSchema: FormSchema,
  action: (
    prisma: PrismaService,
    formState: FormState,
    formData: any,
  ) => Effect.Effect<FormState, any, any>,
  roles?: readonly Role[],
): Promise<FormState> {
  return Effect.runPromise(
    Effect.tryPromise(() => headers()).pipe(
      Effect.flatMap((headersList) => {
        const requestId = requestIdFromHeaders(headersList);

        const inner = recoverPrismaConnectionDefects(
          Effect.gen(function* () {
            if (roles) {
              yield* verifySession(roles);
            }
            const prisma = yield* PrismaService;
            const allFormData = extractAllFormData(formData);
            const validated = yield* validateFormData<FormSchema, FormErrors>(
              allFormData,
              formSchema,
            );
            return yield* action(prisma, formState, validated);
          }),
          action.name || "runEffectAsFormAction",
        ).pipe(Effect.catchAll(handleFormCatchAll<FormState>(formState)));

        return withWideEvent(inner, {
          message: "form action",
          kind: "mutation",
          requestId,
          roles,
          name: action.name || "unnamed form action",
          defaultLogLevel: "Info",
          setLogLevel: (value) => {
            const errors =
              value && typeof value === "object" && "errors" in value
                ? (value as { errors?: Record<string, unknown> }).errors
                : undefined;
            const hasErrors = !!errors && Object.keys(errors).length > 0;
            return { level: hasErrors ? "Warning" : "Info" };
          },
        });
      }),
      Effect.provide(PrismaLayer),
      Effect.provide(LoggingLayer),
    ) as Effect.Effect<FormState, never, never>,
  );
}

const handleFormCatchAll =
  <FormState>(formState: FormState) =>
  (error: unknown) => {
    if (
      error instanceof SessionNotFound ||
      error instanceof PasswordChangeRequired
    ) {
      return Effect.succeed({
        ...formState,
        success: false,
        errors: {
          auth: error.toString(),
        },
      });
    }
    if (error instanceof Forbidden) {
      return Effect.succeed({
        ...formState,
        success: false,
        errors: { dataValidation: FORBIDDEN_MESSAGE },
      });
    }
    if (
      error &&
      typeof error === "object" &&
      "errors" in error &&
      typeof error.errors === "object"
    ) {
      return Effect.succeed({
        ...formState,
        success: false,
        errors: { ...error.errors },
      });
    }
    return Effect.logError("Unhandled form action error", error).pipe(
      Effect.as({
        ...formState,
        success: false,
        errors: { dataValidation: toErrorMessage(error) },
      }),
    );
  };

export function extractAllFormData(
  formData: FormData,
): Record<string, FormDataEntryValue | null> {
  const data: Record<string, FormDataEntryValue | null> = {};
  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }
  return data;
}
export function validateFormData<
  S extends Schema.Schema<any, any, never>,
  FormErrors,
>(data: Record<string, FormDataEntryValue | null>, schema: S) {
  return Schema.decodeUnknown(schema)(data).pipe(
    Effect.mapError((error) => {
      const formatted = Effect.runSync(
        ParseResult.ArrayFormatter.formatError(error),
      );
      const fieldErrors = Object.groupBy(formatted, (issue) =>
        issue.path.join("."),
      );
      return {
        errors: Object.entries(fieldErrors).reduce<Record<string, string[]>>(
          (acc, [key, issues]) => {
            if (issues) {
              acc[key] = issues.map((issue) => issue.message);
            }
            return acc;
          },
          {},
        ) as FormErrors,
      };
    }),
  );
}
