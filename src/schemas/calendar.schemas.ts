import { Data, Schema } from "effect";

import {
  HOURS_PER_DAY,
  INVALID_DATE_MESSAGE,
  INVALID_HOUR_MESSAGE,
  INVALID_INTERVAL_MESSAGE,
  REPEATS_VALUE,
  TITLE_REQUIRED_MESSAGE,
} from "@/constants/calendar";
import {
  CalendarEventColor,
  CalendarEventType,
  RecurrenceEnd,
  RecurrenceFrequency,
} from "@/generated/prisma/enums";
import { isDateKey } from "@/lib/calendar";
import { FormState } from "@/schemas/forms.schemas";

const DateKeySchema = Schema.String.pipe(
  Schema.filter((value) => isDateKey(value) || INVALID_DATE_MESSAGE),
);

const IntFromFormSchema = Schema.NumberFromString.pipe(Schema.int());

export const CalendarEventFormSchema = Schema.Struct({
  id: Schema.optional(Schema.String),
  command: Schema.Literal("save", "delete"),
  type: Schema.Enums(CalendarEventType),
  title: Schema.Trim.pipe(
    Schema.minLength(1, { message: () => TITLE_REQUIRED_MESSAGE }),
  ),
  detail: Schema.Trim,
  date: DateKeySchema,
  hour: IntFromFormSchema.pipe(
    Schema.between(0, HOURS_PER_DAY - 1, {
      message: () => INVALID_HOUR_MESSAGE,
    }),
  ),
  color: Schema.Enums(CalendarEventColor),
  repeats: Schema.optional(Schema.Literal(REPEATS_VALUE)),
  frequency: Schema.Enums(RecurrenceFrequency),
  interval: IntFromFormSchema.pipe(
    Schema.greaterThanOrEqualTo(1, {
      message: () => INVALID_INTERVAL_MESSAGE,
    }),
  ),
  weekdays: Schema.String,
  endType: Schema.Enums(RecurrenceEnd),
  endDate: Schema.String,
  endCount: Schema.String,
});

export type CalendarEventFormData = typeof CalendarEventFormSchema.Type;

export type CalendarEventFormErrors = {
  id?: string[];
  command?: string[];
  type?: string[];
  title?: string[];
  detail?: string[];
  date?: string[];
  hour?: string[];
  color?: string[];
  repeats?: string[];
  frequency?: string[];
  interval?: string[];
  weekdays?: string[];
  endType?: string[];
  endDate?: string[];
  endCount?: string[];
  dataValidation?: string;
  schemaValidation?: string;
};

export type CalendarEventFormState =
  | (FormState & {
      errors?: CalendarEventFormErrors;
      date?: string;
    })
  | undefined;

export class CalendarEventNotFound extends Data.TaggedError(
  "CalendarEventNotFound",
)<{
  readonly id: number;
}> {}

export const TrelloCardSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  due: Schema.NullOr(Schema.String),
  labels: Schema.Array(
    Schema.Struct({
      color: Schema.NullOr(Schema.String),
    }),
  ),
});

export type TrelloCard = typeof TrelloCardSchema.Type;

export const TrelloBoardConfigSchema = Schema.Struct({
  name: Schema.String,
  boardId: Schema.String,
  apiKey: Schema.String,
  apiToken: Schema.String,
  type: Schema.Enums(CalendarEventType),
  color: Schema.Enums(CalendarEventColor),
  detail: Schema.optionalWith(Schema.String, { default: () => "" }),
  labelColors: Schema.optionalWith(
    Schema.Record({
      key: Schema.String,
      value: Schema.Enums(CalendarEventColor),
    }),
    { default: () => ({}) },
  ),
});

export type TrelloBoardConfig = typeof TrelloBoardConfigSchema.Type;
