import { getReport } from "@/actions/report";
import { ReportDocument, ReportError } from "@/components/ReportDocument";
import { PUNCH_REPORT_PRINT_PATH } from "@/constants/punch";
import { parseReportRequest } from "@/lib/report";
import { requireActiveSession } from "@/lib/session";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: PageProps) {
  await requireActiveSession(PUNCH_REPORT_PRINT_PATH);
  const result = parseReportRequest(await searchParams);

  return (
    <div className="min-w-0 p-4 print:p-0">
      {"error" in result ? (
        <ReportError message={result.error} />
      ) : (
        <ReportDocument
          report={await getReport(result.request)}
          generatedAt={new Date()}
        />
      )}
    </div>
  );
}
