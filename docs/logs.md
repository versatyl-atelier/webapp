# Logs

Every request and action logs one wide event, so every change in the system leaves an auditable trace.

- `protectedEffect`, `cachedGetter` and `runEffectAsFormAction` (`src/lib/effect.ts`) log it for you
- Anything else that runs an Effect (e.g. API routes) wraps it in `withWideEvent` (`src/lib/logging.ts`)
- Add details to the event with `Effect.annotateLogs` rather than logging separate lines
