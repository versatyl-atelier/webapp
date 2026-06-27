"use client";

import { Suspense, use, useState } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxSeparator,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { usePageContext } from "@/app/employee/[id]/context-provider";

type ProjectSelectProps = {
  defaultSelectedProjectOrTask?: {
    id: string | number;
    type: "trello" | "task";
  };
};

export default function ProjectSelect({
  defaultSelectedProjectOrTask = {
    id: "",
    type: "trello",
  },
}: ProjectSelectProps) {
  const { projectsPromise, tasksPromise } = usePageContext();
  const projects = use(projectsPromise);
  const tasks = use(tasksPromise);
  const [selectedProjectOrTask, setSelectedProjectOrTask] = useState(
    defaultSelectedProjectOrTask,
  );
  const { id, type } = selectedProjectOrTask;
  const selected = (type === "task" ? tasks : projects).find(
    ({ id }) => id.toString() === selectedProjectOrTask.id.toString(),
  );

  const projectName = selected?.name || "";
  const stringId = typeof id === "number" ? id.toString() : id;

  return (
    <Field>
      <FieldLabel className="mb-1 block text-xs font-semibold text-black uppercase">
        Projet/Tâche
      </FieldLabel>
      <Suspense
        fallback={
          <Input
            type="text"
            // value={selectedProjectOrTask}
            disabled
            className="w-full rounded border-2 border-black bg-gray-100 px-2.5 py-2 text-xs text-gray-600"
          />
        }
      >
        <Combobox
          value={`${type}-${stringId}`}
          onValueChange={(value) => {
            if (!value) {
              return setSelectedProjectOrTask(defaultSelectedProjectOrTask);
            }
            const [type, id] = value.split("-");
            if (type !== "trello" && type !== "task") {
              console.error(`Unexpected type ${type}`);
              return setSelectedProjectOrTask(defaultSelectedProjectOrTask);
            }
            return setSelectedProjectOrTask({
              id,
              type,
            });
          }}
          name="projectId"
        >
          <ComboboxInput
            className="border-punch-accent bg-punch-light/40 [&>div>button]:bg-punch-accent [&>div>button]:hover:bg-punch-accent-hover rounded-xs border-2 [&>div>button]:rounded-full [&>div>button]:text-white [&>div>button]:hover:text-white [&>div>button>svg]:size-0.5"
            placeholder="Rechercher un projet..."
            value={projectName}
            showClear
          />
          <ComboboxContent
            side="top"
            sideOffset={8}
            className="max-h-75 rounded border-2 border-black bg-white shadow-lg"
          >
            <ComboboxList>
              <ComboboxGroup key="tasks" items={tasks}>
                <ComboboxLabel className="bg-black py-2 font-bold text-white uppercase">
                  Tâches
                </ComboboxLabel>
                {tasks.length === 0 && (
                  <ComboboxEmpty>Aucune tâche trouvée</ComboboxEmpty>
                )}
                <ComboboxCollection>
                  {(task) => (
                    <ComboboxItem
                      key={task.id}
                      value={`task-${task.id}`}
                      className="text-punch-dark text-md border-l-punch-accent-hover border-y-punch-light hover:bg-punch-accent-hover data-highlighted:bg-punch-accent-hover cursor-pointer rounded-none border-b border-l-4 px-2.5 py-2.5 transition-all hover:translate-x-1 hover:text-white"
                    >
                      {task.name}
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
              <ComboboxSeparator />
              <ComboboxGroup key="projets" items={projects}>
                <ComboboxLabel className="bg-black py-2 font-bold text-white uppercase">
                  Projets Trello
                </ComboboxLabel>
                {projects.length === 0 && (
                  <ComboboxEmpty>Aucun projet trouvé</ComboboxEmpty>
                )}
                <ComboboxCollection>
                  {(project) => (
                    <ComboboxItem
                      key={project.id}
                      value={`trello-${project.id}`}
                      className="text-punch-dark text-md border-l-punch-accent border-y-punch-light hover:bg-punch-accent data-highlighted:bg-punch-accent border-r-punch-light cursor-pointer rounded-none border-r-4 border-b border-l-4 px-2.5 py-2.5 transition-all hover:translate-x-1 hover:border-r-0 hover:text-white"
                    >
                      {project.name}
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
              <ComboboxSeparator />
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </Suspense>
    </Field>
  );
}
