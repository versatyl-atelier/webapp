"use server";

import "server-only";

import { Role } from "@/generated/prisma/enums";
import { cachedGetter, runEffectAsFormAction } from "@/lib/effect";
import {
  getCalendarEventEffect,
  getCalendarOccurrencesEffect,
  getEventOccurrencesEffect,
  saveCalendarEventEffect,
} from "@/effects/calendar";
import {
  CalendarEventFormSchema,
  type CalendarEventFormErrors,
  type CalendarEventFormState,
} from "@/schemas/calendar.schemas";

export const getCalendarOccurrences = cachedGetter(
  getCalendarOccurrencesEffect,
  [Role.employee],
);

export const getHomeCalendarOccurrences = cachedGetter(
  getCalendarOccurrencesEffect,
  [Role.atelier],
);

export const getHomeEventOccurrences = cachedGetter(getEventOccurrencesEffect, [
  Role.atelier,
]);

export const getCalendarEvent = cachedGetter(getCalendarEventEffect, [
  Role.manager,
]);

export async function saveCalendarEvent(
  formState: CalendarEventFormState,
  formData: FormData,
): Promise<CalendarEventFormState> {
  return runEffectAsFormAction<
    CalendarEventFormState,
    typeof CalendarEventFormSchema,
    CalendarEventFormErrors
  >(formState, formData, CalendarEventFormSchema, saveCalendarEventEffect, [
    Role.manager,
  ]);
}
