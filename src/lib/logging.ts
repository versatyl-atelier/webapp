import "server-only";

import { Cause, Effect, Exit, Layer, Logger, LogLevel, Option } from "effect";

import { Role } from "@/generated/prisma/enums";
import { isPrismaError } from "@/lib/prismaErrors";
import { LOG_LEVEL } from "@/constants/logging";
import { EXITS } from "@/constants/logging";
const { FAILURE, SUCCESS } = EXITS;

const LOG_LEVEL_LITERALS: Record<string, LogLevel.Literal> = {
  all: "All",
  fatal: "Fatal",
  error: "Error",
  warning: "Warning",
  warn: "Warning",
  info: "Info",
  debug: "Debug",
  trace: "Trace",
  none: "None",
  off: "None",
};

export const LoggingLayer = Layer.mergeAll(
  Logger.json,
  Logger.minimumLogLevel(
    LogLevel.fromLiteral(LOG_LEVEL_LITERALS[LOG_LEVEL.toLowerCase()] ?? "Info"),
  ),
);

const VERCEL_REQUEST_ID_HEADER = "x-vercel-id";

export const requestIdFromHeaders = (headersList: Headers): string =>
  headersList.get(VERCEL_REQUEST_ID_HEADER) ?? crypto.randomUUID();

export interface WideEventOptions<A> {
  readonly message: string;
  readonly kind: string;
  readonly name?: string;
  readonly role?: Role;
  readonly requestId: string;
  readonly defaultLogLevel: LogLevel.Literal;
  readonly setLogLevel?: (value: A) => { level: LogLevel.Literal };
}

const logAt = (
  level: LogLevel.Literal,
  event: string,
  fields: Record<string, unknown>,
) =>
  Effect.logWithLevel(LogLevel.fromLiteral(level), event).pipe(
    Effect.annotateLogs(fields),
  );

export const withWideEvent = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
  options: WideEventOptions<A>,
): Effect.Effect<A, E, R> => {
  const { message } = options;

  return Effect.gen(function* () {
    yield* Effect.annotateLogsScoped({
      requestId: options.requestId,
      kind: options.kind,
      ...(options.name ? { name: options.name } : {}),
      ...(options.role ? { role: options.role } : {}),
    });
    return yield* effect;
  }).pipe(
    Effect.onExit((exit) => {
      if (Exit.isSuccess(exit)) {
        const { level } = options.setLogLevel?.(exit.value) ?? {
          level: options.defaultLogLevel,
        };
        return logAt(level, message, { outcome: SUCCESS });
      }
      const failure = Cause.failureOption(exit.cause);
      if (Option.isSome(failure) && isPrismaError(failure.value)) {
        const { operation, model, _tag } = failure.value;
        return logAt("Error", message, {
          model,
          operation,
          outcome: FAILURE,
          errorTag: _tag,
        });
      }
      return Effect.logError(message, exit.cause).pipe(
        Effect.annotateLogs({ outcome: FAILURE }),
      );
    }),
    Effect.withLogSpan(options.kind),
    Effect.scoped,
  ) as Effect.Effect<A, E, R>;
};
