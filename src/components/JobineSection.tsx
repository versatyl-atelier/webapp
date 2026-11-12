import { Archive, ArchiveRestore } from "lucide-react";
import type { ReactNode } from "react";

import { archiveJobine, restoreJobine } from "@/actions/jobines";
import { ActionButton } from "@/components/ActionButton";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { EditJobineDialog } from "@/components/EditJobineDialog";
import { ARCHIVE_LABEL } from "@/constants/accounts";
import { ARCHIVE_JOBINE_DESCRIPTION, RESTORE_LABEL } from "@/constants/jobines";
import type { JobineRecord } from "@/lib/jobines";
import { projectColorStyle } from "@/lib/projects";

type JobineSectionProps = {
  title: string;
  jobines: JobineRecord[];
  emptyLabel: string;
  children?: ReactNode;
};

function JobineActions({ jobine }: { jobine: JobineRecord }) {
  const fields = { jobineId: String(jobine.id) };
  return jobine.isDeleted ? (
    <ActionButton
      action={restoreJobine}
      fields={fields}
      label={`${RESTORE_LABEL} ${jobine.name}`}
      icon={<ArchiveRestore />}
      tone="create"
    />
  ) : (
    <ConfirmDeleteButton
      action={archiveJobine}
      fields={fields}
      title={`${ARCHIVE_LABEL} « ${jobine.name} » ?`}
      description={ARCHIVE_JOBINE_DESCRIPTION}
      label={`${ARCHIVE_LABEL} ${jobine.name}`}
      confirmLabel={ARCHIVE_LABEL}
      icon={<Archive />}
    />
  );
}

export function JobineSection({
  title,
  jobines,
  emptyLabel,
  children,
}: JobineSectionProps) {
  return (
    <section className="bg-card rounded-lg border-2 p-2">
      <h2 className="border-primary mb-2 border-b-2 pb-1 text-center text-xs font-bold">
        {title} ({jobines.length})
      </h2>
      {jobines.length === 0 ? (
        <p className="text-muted-foreground text-sm">{emptyLabel}</p>
      ) : (
        <ul>
          {jobines.map((jobine) => (
            <li
              key={jobine.id}
              className="flex items-start gap-2 border-t py-1 first:border-t-0"
            >
              <span
                aria-hidden
                style={projectColorStyle(jobine.color)}
                className="mt-0.5 size-4 shrink-0 rounded-sm bg-(--project-color)"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm wrap-break-word">{jobine.name}</p>
                {jobine.description && (
                  <p className="text-muted-foreground text-xs wrap-break-word whitespace-pre-line">
                    {jobine.description}
                  </p>
                )}
              </div>
              <EditJobineDialog jobine={jobine} />
              <JobineActions jobine={jobine} />
            </li>
          ))}
        </ul>
      )}
      {children && <div className="mt-2 border-t-2 pt-2">{children}</div>}
    </section>
  );
}
