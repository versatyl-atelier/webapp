"use client";

import { useTransition, type KeyboardEvent } from "react";
import { toast } from "sonner";

import { saveProjectHeader } from "@/actions/projects";
import { PinButton } from "@/components/PinButton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ENTER_KEY } from "@/constants/keys";
import {
  NO_PROJECT_STAGE_LABEL,
  NO_PROJECT_STAGE_VALUE,
  PROJECT_STAGE_LABEL,
  PROJECT_STAGE_LABELS,
  PROJECT_STAGES,
  PROJECT_TITLE_LABEL,
  PROJECT_TITLE_PLACEHOLDER,
  SAVED_TOAST_OPTIONS,
} from "@/constants/projects";
import type { ProjectFiche } from "@/lib/projects";

const STAGE_ITEMS = {
  [NO_PROJECT_STAGE_VALUE]: NO_PROJECT_STAGE_LABEL,
  ...PROJECT_STAGE_LABELS,
};

type ProjectHeaderProps = {
  project: Pick<ProjectFiche, "id" | "name" | "stage" | "isManual">;
  pinned: boolean;
};

export function ProjectHeader({ project, pinned }: ProjectHeaderProps) {
  const [pending, startTransition] = useTransition();
  const stage = project.stage ?? NO_PROJECT_STAGE_VALUE;

  const save = (name: string, nextStage: string) =>
    startTransition(async () => {
      const formData = new FormData();
      formData.set("projectId", project.id);
      formData.set("name", name);
      formData.set("stage", nextStage);
      const state = await saveProjectHeader(undefined, formData);
      const error = state?.errors?.name?.[0] ?? state?.errors?.dataValidation;
      if (error) {
        toast.error(error);
      } else if (state?.message) {
        toast.success(state.message, SAVED_TOAST_OPTIONS);
      }
    });

  const commitName = (input: HTMLInputElement) => {
    const name = input.value.trim();
    if (!name) {
      input.value = project.name;
    } else if (name !== project.name) {
      save(name, stage);
    }
  };

  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {project.isManual ? (
        <Input
          aria-label={PROJECT_TITLE_LABEL}
          defaultValue={project.name}
          placeholder={PROJECT_TITLE_PLACEHOLDER}
          disabled={pending}
          onBlur={(event) => commitName(event.currentTarget)}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === ENTER_KEY) {
              event.currentTarget.blur();
            }
          }}
          className="hover:border-input focus-visible:bg-card field-sizing-content h-auto max-w-full min-w-72 border-transparent bg-transparent px-2 py-0.5 text-2xl font-semibold tracking-tight shadow-none md:text-2xl dark:bg-transparent"
        />
      ) : (
        <h1 className="px-2 py-0.5 text-2xl font-semibold tracking-tight">
          {project.name}
        </h1>
      )}
      <div className="ml-auto flex items-center gap-2">
        <Select
          items={STAGE_ITEMS}
          value={stage}
          onValueChange={(value) => {
            if (value !== null && value !== stage) {
              save(project.name, value);
            }
          }}
        >
          <SelectTrigger
            size="sm"
            aria-label={PROJECT_STAGE_LABEL}
            disabled={pending}
            className="text-muted-foreground"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_PROJECT_STAGE_VALUE}>
              {NO_PROJECT_STAGE_LABEL}
            </SelectItem>
            {PROJECT_STAGES.map((value) => (
              <SelectItem key={value} value={value}>
                {PROJECT_STAGE_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <PinButton projectId={project.id} pinned={pinned} variant="ghost" />
      </div>
    </header>
  );
}
