import { Schema } from "effect";
import {
  COPY_COMMAND,
  DELETE_COMMAND,
  MOVE_COMMAND,
  UNDO_COPY_COMMAND,
  UNDO_MOVE_COMMAND,
} from "@/constants/timeEntries";
import { FormState } from "@/schemas/forms.schemas";
import { TimeEntryGetPayload } from "@/generated/prisma/models";

export const EditTimeEntryFormSchema = Schema.Struct({
  timeEntryId: Schema.String,
  projectId: Schema.String,
  startTime: Schema.String,
  hours: Schema.String,
  date: Schema.optional(Schema.String),
  subtaskId: Schema.optional(Schema.String),
  command: Schema.Literal("save", "delete", COPY_COMMAND),
});

export type EditTimeEntryFormErrors = {
  timeEntryId?: string[];
  projectId?: string[];
  startTime?: string[];
  hours?: string[];
  date?: string[];
  subtaskId?: string[];
  command?: string[];
};

export type EditTimeEntryFormState =
  | (FormState & {
      errors?: EditTimeEntryFormErrors;
    })
  | undefined;

export const AddManualTimeFormSchema = Schema.Struct({
  employeeId: Schema.String,
  projectId: Schema.String,
  hours: Schema.String,
  date: Schema.String,
  command: Schema.Literal("add", "lunch"),
});

export type AddManualTimeFormErrors = {
  employeeId?: string[];
  projectId?: string[];
  hours?: string[];
  date?: string[];
  command?: string[];
};

export type AddManualTimeFormState =
  | (FormState & {
      errors?: AddManualTimeFormErrors;
    })
  | undefined;

export const MoveTimeEntryFormSchema = Schema.Struct({
  timeEntryId: Schema.String,
  date: Schema.String,
  sourceDate: Schema.optional(Schema.String),
  command: Schema.Literal(
    MOVE_COMMAND,
    COPY_COMMAND,
    UNDO_MOVE_COMMAND,
    UNDO_COPY_COMMAND,
    DELETE_COMMAND,
  ),
});

export type MoveTimeEntryFormErrors = {
  timeEntryId?: string[];
  date?: string[];
  sourceDate?: string[];
  command?: string[];
};

export type MoveTimeEntryUndo = {
  timeEntryId: string;
  date: string;
  command: typeof UNDO_MOVE_COMMAND | typeof UNDO_COPY_COMMAND;
};

export type MoveTimeEntryFormState =
  | (FormState & {
      errors?: MoveTimeEntryFormErrors;
      undo?: MoveTimeEntryUndo;
    })
  | undefined;

export type Employee = {
  id: number;
  name: string;
  weeklyTarget?: number;
};

export type DateRange = {
  startDate: string;
  endDate: string;
};

export const timeEntryInclude = {
  subtask: {
    select: { name: true },
  },
  projects: {
    include: {
      project: {
        select: { name: true },
      },
      task: {
        select: { name: true },
      },
    },
  },
};

export type TimeEntryWithRelations = TimeEntryGetPayload<{
  include: typeof timeEntryInclude;
}>;
