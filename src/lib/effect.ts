import "server-only";

import { Effect } from "effect";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { SessionNotFound, verifySession } from "@/app/effects/auth";
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
  role?: Role,
  redirectTo?: string,
) {
  return cache(protectedEffect<T, E, R>(getEffect, role, redirectTo));
}

export function protectedEffect<T, E, R>(
  getEffect: (prisma: PrismaService, ...args: any) => Effect.Effect<T, E, R>,
  role?: Role,
  redirectTo?: string,
) {
  return async (...args: any) => {
    const headersList = await headers();
    const requestId = requestIdFromHeaders(headersList);

    if (role) {
      const referer = headersList.get("referer");
      const fallbackRedirect =
        redirectTo ??
        (referer ? new URL(referer).pathname + new URL(referer).search : "/");

      try {
        await Effect.runPromise(verifySession(role));
      } catch (error) {
        const anyError: any = error;
        if (anyError?.name === "(FiberFailure) SessionNotFound") {
          const qs = new URLSearchParams();
          if (role) {
            qs.append("role", role);
          }
          if (redirectTo) {
            qs.append("redirectTo", encodeURIComponent(fallbackRedirect));
          }
          redirect(`/login?${qs.toString()}`);
        }
        throw error;
      }
    }

    const operation = getEffect.name || "unnamed protected effect";
    const name = operation;

    return Effect.runPromise(
      withWideEvent(
        recoverPrismaConnectionDefects(
          Effect.gen(function* () {
            const prisma = yield* PrismaService;
            return yield* getEffect(prisma, ...args);
          }),
          operation,
        ),
        {
          message: "Protected action",
          kind: "read",
          requestId,
          role,
          name,
          defaultLogLevel: "Debug",
        },
      ).pipe(
        Effect.provide(PrismaLayer),
        Effect.provide(LoggingLayer),
      ) as Effect.Effect<T, E, never>,
    );
  };
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
  role?: Role,
): Promise<FormState> {
  return Effect.runPromise(
    Effect.gen(function* () {
      const headersList = yield* Effect.tryPromise(() => headers());
      const requestId = requestIdFromHeaders(headersList);

      const inner = recoverPrismaConnectionDefects(
        Effect.gen(function* () {
          if (role) {
            yield* verifySession(role);
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

      return yield* withWideEvent(inner, {
        message: "form action",
        kind: "mutation",
        requestId,
        role,
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
    }).pipe(
      Effect.provide(PrismaLayer),
      Effect.provide(LoggingLayer),
    ) as Effect.Effect<FormState, never, never>,
  );
}

const handleFormCatchAll =
  <FormState>(formState: FormState) =>
  (error: unknown) => {
    if (error instanceof SessionNotFound) {
      return Effect.succeed({
        ...formState,
        success: false,
        errors: {
          auth: error.toString(),
        },
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
    return Effect.succeed({
      ...formState,
      success: false,
      errors: { dataValidation: toErrorMessage(error) },
    });
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
