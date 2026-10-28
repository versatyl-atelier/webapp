import { NextRequest } from "next/server";

import { getReport } from "@/actions/report";
import {
  REPORT_END_PARAM,
  REPORT_GROUPING_PARAM,
  REPORT_PROJECT_PARAM,
  REPORT_START_PARAM,
} from "@/constants/report";
import { PUNCH_REPORT_PRINT_PATH } from "@/constants/punch";
import { parseReportRequest } from "@/lib/report";
import { renderReportErrorHtml, renderReportHtml } from "@/lib/reportHtml";
import { requireActiveSession } from "@/lib/session";

const HTML_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
const BAD_REQUEST_STATUS = 400;

export async function GET(request: NextRequest) {
  await requireActiveSession(PUNCH_REPORT_PRINT_PATH);

  const { searchParams } = request.nextUrl;
  const result = parseReportRequest({
    [REPORT_PROJECT_PARAM]: searchParams.getAll(REPORT_PROJECT_PARAM),
    [REPORT_GROUPING_PARAM]: searchParams.getAll(REPORT_GROUPING_PARAM),
    [REPORT_START_PARAM]: searchParams.get(REPORT_START_PARAM) ?? undefined,
    [REPORT_END_PARAM]: searchParams.get(REPORT_END_PARAM) ?? undefined,
  });

  if ("error" in result) {
    return new Response(renderReportErrorHtml(result.error), {
      status: BAD_REQUEST_STATUS,
      headers: HTML_HEADERS,
    });
  }

  const report = await getReport(result.request);
  return new Response(renderReportHtml(report, new Date()), {
    headers: HTML_HEADERS,
  });
}
