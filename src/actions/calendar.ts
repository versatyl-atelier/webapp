"use server";

import "server-only";

import { Role } from "@/generated/prisma/enums";
import { isDateKey, type CalendarOccurrence } from "@/lib/calendar";
import { cachedGetter, runEffectAsFormAction } from "@/lib/effect";
import {
  getCalendarEventEffect,
  getCalendarOccurrencesEffect,
  getEventTemplatesEffect,
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

export const getCalendarEvent = cachedGetter(getCalendarEventEffect, [
  Role.manager,
]);

export const getEventTemplates = cachedGetter(getEventTemplatesEffect, [
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

export async function loadDayOccurrences(
  date: string,
): Promise<CalendarOccurrence[]> {
  return isDateKey(date) ? getCalendarOccurrences(date, date) : [];
}
