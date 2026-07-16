import "server-only";

import { Effect } from "effect";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { SessionNotFound, verifySession } from "@/app/effects/auth";
import { Role } from "@/generated/prisma/enums";
import { ParseResult, Schema } from "effect";

export function cachedGetter<T, E, R>(
  getEffect: (...args: any) => Effect.Effect<T, E, never>,
  role?: Role,
  redirectTo?: string,
) {
  return cache(protectedEffect<T, E, R>(getEffect, role, redirectTo));
}

export function protectedEffect<T, E, R>(
  getEffect: (...args: any) => Effect.Effect<T, E, never>,
  role?: Role,
  redirectTo?: string,
) {
  return async (...args: any) => {
    if (role) {
      const headersList = await headers();
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

    return Effect.runPromise(getEffect(...args));
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
    formState: FormState,
    formData: any,
  ) => Effect.Effect<FormState, unknown, never>,
  role?: Role,
): Promise<FormState> {
  return Effect.runPromise(
    Effect.gen(function* () {
      if (role) {
        yield* verifySession(role);
      }
      const allFormData = extractAllFormData(formData);
      const validated = yield* validateFormData<FormSchema, FormErrors>(
        allFormData,
        formSchema,
      );
      return yield* action(formState, validated);
    }).pipe(Effect.catchAll(handleFormCatchAll<FormState>(formState))),
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
    console.error(error);
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
    return Effect.fail(error);
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
