import { deleteSubtask } from "@/actions/tasks";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { EditSubtaskDialog } from "@/components/EditSubtaskDialog";
import { SubtaskForm } from "@/components/SubtaskForm";
import {
  DEFAULT_SUBTASK_ID,
  DELETE_LABEL,
  DELETE_SUBTASK_DESCRIPTION,
  NO_SUBTASKS_LABEL,
  SUBTASKS_SECTION_TITLE,
} from "@/constants/tasks";

type SubtaskSectionProps = {
  subtasks: { id: string; name: string }[];
};

export function SubtaskSection({ subtasks }: SubtaskSectionProps) {
  return (
    <section className="bg-card rounded-lg border-2 p-2">
      <h2 className="border-primary mb-2 border-b-2 pb-1 text-center text-xs font-bold">
        {SUBTASKS_SECTION_TITLE}
      </h2>
      {subtasks.length === 0 ? (
        <p className="text-muted-foreground text-sm">{NO_SUBTASKS_LABEL}</p>
      ) : (
        <ul>
          {subtasks.map((subtask) => (
            <li
              key={subtask.id}
              className="flex items-center gap-2 border-t py-1 first:border-t-0"
            >
              <span className="min-w-0 flex-1 text-sm wrap-break-word">
                {subtask.name}
              </span>
              <EditSubtaskDialog subtask={subtask} />
              {subtask.id !== DEFAULT_SUBTASK_ID && (
                <ConfirmDeleteButton
                  action={deleteSubtask}
                  fields={{ id: subtask.id }}
                  title={`${DELETE_LABEL} « ${subtask.name} » ?`}
                  description={DELETE_SUBTASK_DESCRIPTION}
                  label={`${DELETE_LABEL} ${subtask.name}`}
                />
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 border-t-2 pt-2">
        <SubtaskForm />
      </div>
    </section>
  );
}
