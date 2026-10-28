"use server";

import "server-only";

import { Role } from "@/generated/prisma/enums";
import { cachedGetter, runEffectAsFormAction } from "@/lib/effect";
import {
  addSubtaskEffect,
  addTaskEffect,
  deleteSubtaskEffect,
  deleteTaskEffect,
  editSubtaskEffect,
  editTaskEffect,
  getSubtasksEffect,
  getTasksEffect,
} from "@/effects/tasks";
import {
  AddSubtaskFormSchema,
  AddTaskFormSchema,
  DeleteSubtaskFormSchema,
  DeleteTaskFormSchema,
  EditSubtaskFormSchema,
  EditTaskFormSchema,
  type SubtaskFormErrors,
  type SubtaskFormState,
  type TaskFormErrors,
  type TaskFormState,
} from "@/schemas/tasks.schemas";

export const getTasks = cachedGetter(getTasksEffect, [Role.employee]);

export const getSubtasks = cachedGetter(getSubtasksEffect, [Role.employee]);

export async function addTask(
  formState: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  return runEffectAsFormAction<
    TaskFormState,
    typeof AddTaskFormSchema,
    TaskFormErrors
  >(formState, formData, AddTaskFormSchema, addTaskEffect, [Role.manager]);
}

export async function editTask(
  formState: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  return runEffectAsFormAction<
    TaskFormState,
    typeof EditTaskFormSchema,
    TaskFormErrors
  >(formState, formData, EditTaskFormSchema, editTaskEffect, [Role.manager]);
}

export async function deleteTask(
  formState: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  return runEffectAsFormAction<
    TaskFormState,
    typeof DeleteTaskFormSchema,
    TaskFormErrors
  >(formState, formData, DeleteTaskFormSchema, deleteTaskEffect, [
    Role.manager,
  ]);
}

export async function addSubtask(
  formState: SubtaskFormState,
  formData: FormData,
): Promise<SubtaskFormState> {
  return runEffectAsFormAction<
    SubtaskFormState,
    typeof AddSubtaskFormSchema,
    SubtaskFormErrors
  >(formState, formData, AddSubtaskFormSchema, addSubtaskEffect, [
    Role.manager,
  ]);
}

export async function editSubtask(
  formState: SubtaskFormState,
  formData: FormData,
): Promise<SubtaskFormState> {
  return runEffectAsFormAction<
    SubtaskFormState,
    typeof EditSubtaskFormSchema,
    SubtaskFormErrors
  >(formState, formData, EditSubtaskFormSchema, editSubtaskEffect, [
    Role.manager,
  ]);
}

export async function deleteSubtask(
  formState: SubtaskFormState,
  formData: FormData,
): Promise<SubtaskFormState> {
  return runEffectAsFormAction<
    SubtaskFormState,
    typeof DeleteSubtaskFormSchema,
    SubtaskFormErrors
  >(formState, formData, DeleteSubtaskFormSchema, deleteSubtaskEffect, [
    Role.manager,
  ]);
}
