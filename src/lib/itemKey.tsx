import { ProjectOrTask } from "@/components/ProjectSelect";

export function parseItemKey(key: string) {
  const [type, id] = key.split(":");
  return { type, id } as ProjectOrTask;
}
export function stringifyItemKey({ type, id }: ProjectOrTask) {
  return `${type}:${id}`;
}
