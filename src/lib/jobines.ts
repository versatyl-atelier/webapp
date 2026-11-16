import type { Jobine } from "@/generated/prisma/client";
import { splitArchived } from "@/lib/archive";
import { matchesQuery } from "@/lib/text";

export type JobineRecord = Pick<
  Jobine,
  "id" | "name" | "description" | "color" | "isDeleted"
>;

export function filterJobines<
  T extends Pick<JobineRecord, "name" | "description" | "isDeleted">,
>(jobines: readonly T[], query: string): { active: T[]; archived: T[] } {
  return splitArchived(
    jobines.filter(({ name, description }) =>
      matchesQuery(query, name, description),
    ),
  );
}
