import { getReportProjects } from "@/actions/report";
import { ReportBuilder } from "@/components/ReportBuilder";
import { PUNCH_REPORT_PATH } from "@/constants/punch";
import { requireActiveSession } from "@/lib/session";

export default async function Page() {
  await requireActiveSession(PUNCH_REPORT_PATH);
  const projects = await getReportProjects();

  return (
    <div className="min-w-0 p-4">
      <ReportBuilder projects={projects} />
    </div>
  );
}
