import { notFound } from "next/navigation";

import { getSubtasks, getTasks } from "@/actions/tasks";
import { SubtaskSection } from "@/components/SubtaskSection";
import { TaskSection } from "@/components/TaskSection";
import { PUNCH_TASKS_PATH } from "@/constants/punch";
import { Role } from "@/generated/prisma/enums";
import { requireActiveSession } from "@/lib/session";

export default async function Page() {
  const session = await requireActiveSession(PUNCH_TASKS_PATH);
  if (session.role !== Role.manager) {
    notFound();
  }
  const [tasks, subtasks] = await Promise.all([getTasks(), getSubtasks()]);

  return (
    <div className="grid items-start gap-4 p-4 md:grid-cols-2">
      <TaskSection tasks={tasks} />
      <SubtaskSection subtasks={subtasks} />
    </div>
  );
}
