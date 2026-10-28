import { deleteTask } from "@/actions/tasks";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { EditTaskDialog } from "@/components/EditTaskDialog";
import { TaskForm } from "@/components/TaskForm";
import {
  DELETE_LABEL,
  LUNCH_TASK_NAME,
  NO_TASKS_LABEL,
  TASKS_SECTION_TITLE,
} from "@/constants/tasks";
import { projectColorStyle } from "@/lib/projects";

type TaskSectionProps = {
  tasks: { id: number; name: string; color: string }[];
};

export function TaskSection({ tasks }: TaskSectionProps) {
  return (
    <section className="bg-card rounded-lg border-2 p-2">
      <h2 className="border-primary mb-2 border-b-2 pb-1 text-center text-xs font-bold">
        {TASKS_SECTION_TITLE}
      </h2>
      {tasks.length === 0 ? (
        <p className="text-muted-foreground text-sm">{NO_TASKS_LABEL}</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-2 border-t py-1 first:border-t-0"
            >
              <span
                aria-hidden
                style={projectColorStyle(task.color)}
                className="size-4 shrink-0 rounded-sm bg-(--project-color)"
              />
              <span className="min-w-0 flex-1 truncate text-sm">
                {task.name}
              </span>
              <EditTaskDialog task={task} />
              {task.name !== LUNCH_TASK_NAME && (
                <ConfirmDeleteButton
                  action={deleteTask}
                  fields={{ taskId: String(task.id) }}
                  title={`${DELETE_LABEL} « ${task.name} » ?`}
                  label={`${DELETE_LABEL} ${task.name}`}
                />
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 border-t-2 pt-2">
        <TaskForm />
      </div>
    </section>
  );
}
