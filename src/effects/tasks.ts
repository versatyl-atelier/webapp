import type { PrismaService } from "@/generated/effect-prisma";
import { SortOrder } from "@/generated/prisma/internal/prismaNamespace";
import {
  SubtaskCreateArgs,
  SubtaskFindFirstArgs,
  SubtaskFindManyArgs,
  SubtaskUpdateArgs,
  TaskCreateArgs,
  TaskFindFirstArgs,
  TaskFindManyArgs,
  TaskUpdateArgs,
  TimeEntryUpdateManyArgs,
} from "@/generated/prisma/models";
import { Effect } from "effect";
import {
  DEFAULT_SUBTASK_ID,
  DEFAULT_SUBTASK_PROTECTED_MESSAGE,
  LUNCH_TASK_NAME,
  LUNCH_TASK_PROTECTED_MESSAGE,
  SUBTASK_ADDED_MESSAGE,
  SUBTASK_DELETED_MESSAGE,
  SUBTASK_NOT_FOUND_MESSAGE,
  SUBTASK_SAVED_MESSAGE,
  TASK_ADDED_MESSAGE,
  TASK_DELETED_MESSAGE,
  TASK_NOT_FOUND_MESSAGE,
  TASK_SAVED_MESSAGE,
} from "@/constants/tasks";
import type {
  AddSubtaskFormData,
  AddTaskFormData,
  DeleteSubtaskFormData,
  DeleteTaskFormData,
  EditSubtaskFormData,
  EditTaskFormData,
  SubtaskFormState,
  TaskFormState,
} from "@/schemas/tasks.schemas";

export const getTasksEffect = Effect.fn("getTasks")(function* (
  prisma: PrismaService,
) {
  const args: TaskFindManyArgs = {
    where: {
      isDeleted: false,
    },
    orderBy: {
      name: SortOrder.asc,
    },
  };
  return yield* prisma.task.findMany(args);
});

export const getSubtasksEffect = Effect.fn("getSubtasks")(function* (
  prisma: PrismaService,
) {
  const args: SubtaskFindManyArgs = {
    where: {
      isDeleted: false,
    },
    orderBy: {
      id: SortOrder.asc,
    },
  };
  return yield* prisma.subtask.findMany(args);
});

const findTask = Effect.fn("findTask")(function* (
  prisma: PrismaService,
  taskId: number,
) {
  const args: TaskFindFirstArgs = { where: { id: taskId, isDeleted: false } };
  return yield* prisma.task.findFirst(args);
});

const findSubtask = Effect.fn("findSubtask")(function* (
  prisma: PrismaService,
  subtaskId: string,
) {
  const args: SubtaskFindFirstArgs = {
    where: { id: subtaskId, isDeleted: false },
  };
  return yield* prisma.subtask.findFirst(args);
});

export const addTaskEffect = Effect.fn("addTask")(function* (
  prisma: PrismaService,
  _formState: TaskFormState,
  { name, color }: AddTaskFormData,
) {
  const args: TaskCreateArgs = { data: { name, color } };
  yield* prisma.task.create(args);
  return { message: TASK_ADDED_MESSAGE };
});

export const editTaskEffect = Effect.fn("editTask")(function* (
  prisma: PrismaService,
  _formState: TaskFormState,
  { taskId, name, color }: EditTaskFormData,
) {
  yield* Effect.annotateLogsScoped({ taskId });
  const task = yield* findTask(prisma, taskId);
  if (!task) {
    return { errors: { taskId: [TASK_NOT_FOUND_MESSAGE] } };
  }
  if (task.name === LUNCH_TASK_NAME && name !== LUNCH_TASK_NAME) {
    return { errors: { name: [LUNCH_TASK_PROTECTED_MESSAGE] } };
  }
  const args: TaskUpdateArgs = { where: { id: taskId }, data: { name, color } };
  yield* prisma.task.update(args);
  return { message: TASK_SAVED_MESSAGE };
});

export const deleteTaskEffect = Effect.fn("deleteTask")(function* (
  prisma: PrismaService,
  _formState: TaskFormState,
  { taskId }: DeleteTaskFormData,
) {
  yield* Effect.annotateLogsScoped({ taskId });
  const task = yield* findTask(prisma, taskId);
  if (!task) {
    return { errors: { taskId: [TASK_NOT_FOUND_MESSAGE] } };
  }
  if (task.name === LUNCH_TASK_NAME) {
    return { errors: { taskId: [LUNCH_TASK_PROTECTED_MESSAGE] } };
  }
  const args: TaskUpdateArgs = {
    where: { id: taskId },
    data: { isDeleted: true, deletedAt: new Date() },
  };
  yield* prisma.task.update(args);
  return { message: TASK_DELETED_MESSAGE };
});

export const addSubtaskEffect = Effect.fn("addSubtask")(function* (
  prisma: PrismaService,
  _formState: SubtaskFormState,
  { name }: AddSubtaskFormData,
) {
  const args: SubtaskCreateArgs = { data: { name } };
  yield* prisma.subtask.create(args);
  return { message: SUBTASK_ADDED_MESSAGE };
});

export const editSubtaskEffect = Effect.fn("editSubtask")(function* (
  prisma: PrismaService,
  _formState: SubtaskFormState,
  { id, name }: EditSubtaskFormData,
) {
  yield* Effect.annotateLogsScoped({ subtaskId: id });
  const subtask = yield* findSubtask(prisma, id);
  if (!subtask) {
    return { errors: { id: [SUBTASK_NOT_FOUND_MESSAGE] } };
  }
  const args: SubtaskUpdateArgs = { where: { id }, data: { name } };
  yield* prisma.subtask.update(args);
  return { message: SUBTASK_SAVED_MESSAGE };
});

export const deleteSubtaskEffect = Effect.fn("deleteSubtask")(function* (
  prisma: PrismaService,
  _formState: SubtaskFormState,
  { id }: DeleteSubtaskFormData,
) {
  yield* Effect.annotateLogsScoped({ subtaskId: id });
  if (id === DEFAULT_SUBTASK_ID) {
    return { errors: { id: [DEFAULT_SUBTASK_PROTECTED_MESSAGE] } };
  }
  const subtask = yield* findSubtask(prisma, id);
  if (!subtask) {
    return { errors: { id: [SUBTASK_NOT_FOUND_MESSAGE] } };
  }
  const moveEntriesArgs: TimeEntryUpdateManyArgs = {
    where: { subtaskId: id },
    data: { subtaskId: DEFAULT_SUBTASK_ID },
  };
  const deleteArgs: SubtaskUpdateArgs = {
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  };
  yield* prisma.$transaction(
    Effect.gen(function* () {
      yield* prisma.timeEntry.updateMany(moveEntriesArgs);
      yield* prisma.subtask.update(deleteArgs);
    }),
  );
  return { message: SUBTASK_DELETED_MESSAGE };
});
