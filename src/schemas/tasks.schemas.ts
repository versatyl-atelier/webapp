import { Schema } from "effect";

import { HEX_COLOR_PATTERN, INVALID_COLOR_MESSAGE } from "@/constants/projects";
import {
  SUBTASK_NAME_LENGTH_MESSAGE,
  SUBTASK_NAME_MAX_LENGTH,
  TASK_NAME_LENGTH_MESSAGE,
  TASK_NAME_MAX_LENGTH,
  TASK_NAME_MIN_LENGTH,
} from "@/constants/tasks";
import { FormState } from "@/schemas/forms.schemas";

const TaskIdSchema = Schema.NumberFromString.pipe(Schema.int());

export const TaskNameSchema = Schema.Trim.pipe(
  Schema.minLength(TASK_NAME_MIN_LENGTH, {
    message: () => TASK_NAME_LENGTH_MESSAGE,
  }),
  Schema.maxLength(TASK_NAME_MAX_LENGTH, {
    message: () => TASK_NAME_LENGTH_MESSAGE,
  }),
);

export const TaskColorSchema = Schema.String.pipe(
  Schema.pattern(HEX_COLOR_PATTERN, { message: () => INVALID_COLOR_MESSAGE }),
);

export const SubtaskNameSchema = Schema.Trim.pipe(
  Schema.minLength(1, { message: () => SUBTASK_NAME_LENGTH_MESSAGE }),
  Schema.maxLength(SUBTASK_NAME_MAX_LENGTH, {
    message: () => SUBTASK_NAME_LENGTH_MESSAGE,
  }),
);

export const AddTaskFormSchema = Schema.Struct({
  name: TaskNameSchema,
  color: TaskColorSchema,
});

export const EditTaskFormSchema = Schema.Struct({
  taskId: TaskIdSchema,
  name: TaskNameSchema,
  color: TaskColorSchema,
});

export const DeleteTaskFormSchema = Schema.Struct({
  taskId: TaskIdSchema,
});

export const AddSubtaskFormSchema = Schema.Struct({
  name: SubtaskNameSchema,
});

export const EditSubtaskFormSchema = Schema.Struct({
  id: Schema.String,
  name: SubtaskNameSchema,
});

export const DeleteSubtaskFormSchema = Schema.Struct({
  id: Schema.String,
});

export type AddTaskFormData = typeof AddTaskFormSchema.Type;
export type EditTaskFormData = typeof EditTaskFormSchema.Type;
export type DeleteTaskFormData = typeof DeleteTaskFormSchema.Type;
export type AddSubtaskFormData = typeof AddSubtaskFormSchema.Type;
export type EditSubtaskFormData = typeof EditSubtaskFormSchema.Type;
export type DeleteSubtaskFormData = typeof DeleteSubtaskFormSchema.Type;

export type TaskFormErrors = {
  taskId?: string[];
  name?: string[];
  color?: string[];
  dataValidation?: string;
  schemaValidation?: string;
};

export type TaskFormState =
  | (FormState & {
      errors?: TaskFormErrors;
    })
  | undefined;

export type SubtaskFormErrors = {
  id?: string[];
  name?: string[];
  dataValidation?: string;
  schemaValidation?: string;
};

export type SubtaskFormState =
  | (FormState & {
      errors?: SubtaskFormErrors;
    })
  | undefined;
