import { notFound } from "next/navigation";

import { getAllJobines } from "@/actions/jobines";
import { JobinesBrowser } from "@/components/JobinesBrowser";
import { PUNCH_JOBINES_PATH } from "@/constants/punch";
import { Role } from "@/generated/prisma/enums";
import { requireActiveSession } from "@/lib/session";

export default async function Page() {
  const session = await requireActiveSession(PUNCH_JOBINES_PATH);
  if (session.role !== Role.manager) {
    notFound();
  }
  const jobines = await getAllJobines();

  return (
    <div className="grid items-start gap-4 p-4 md:grid-cols-2">
      <JobinesBrowser
        jobines={jobines.map(({ id, name, description, color, isDeleted }) => ({
          id,
          name,
          description,
          color,
          isDeleted,
        }))}
      />
    </div>
  );
}
