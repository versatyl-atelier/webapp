import { PrintButton } from "@/components/PrintButton";
import {
  GENERATED_ON_LABEL,
  GROUPING_LABELS,
  NO_DATA_LABEL,
  PERIOD_SECTION_TITLE,
  PROJECT_NAMES_SEPARATOR,
  REPORT_INDENT_CLASSES,
  REPORT_INVALID_TITLE,
  REPORT_TITLE,
  SUMMARY_ENTRIES_LABEL,
  SUMMARY_PROJECTS_LABEL,
  TOTAL_LABEL,
} from "@/constants/report";
import { formatNoteFullTime } from "@/lib/projectNotes";
import { formatReportPeriod, type Report, type ReportRow } from "@/lib/report";
import { cn } from "@/lib/utils";
import { formatDecimalHours } from "@/lib/time";

type ReportDocumentProps = {
  report: Report;
  generatedAt: Date;
};

type ReportErrorProps = {
  message: string;
};

const DOCUMENT_CLASS =
  "bg-card mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-lg border-2 p-4 print:max-w-none print:rounded-none print:border-0 print:bg-white print:p-0 print:text-black";
const TITLE_CLASS = "text-2xl font-bold tracking-tight";
const MUTED_CLASS = "text-muted-foreground text-xs print:text-neutral-600";
const BORDER_CLASS = "border-border print:border-neutral-300";
const SECTION_TITLE_CLASS =
  "border-primary mb-1.5 border-b-2 pb-1 text-xs font-bold uppercase print:border-black";
const CELL_CLASS = `border-t px-1.5 py-1 ${BORDER_CLASS}`;

function indentClass(depth: number): string {
  return REPORT_INDENT_CLASSES[
    Math.min(depth, REPORT_INDENT_CLASSES.length - 1)
  ];
}

function ReportRows({
  rows,
  depth,
}: {
  rows: readonly ReportRow[];
  depth: number;
}) {
  return rows.map((row) => (
    <ReportRowGroup key={row.key} row={row} depth={depth} />
  ));
}

function ReportRowGroup({ row, depth }: { row: ReportRow; depth: number }) {
  return (
    <>
      <tr>
        <th
          scope="row"
          className={cn(
            CELL_CLASS,
            indentClass(depth),
            "text-left",
            depth === 0 ? "font-semibold" : "font-normal",
          )}
        >
          {row.label}
        </th>
        <td className={cn(CELL_CLASS, "text-right whitespace-nowrap")}>
          {formatDecimalHours(row.hours)}
        </td>
      </tr>
      {row.children && <ReportRows rows={row.children} depth={depth + 1} />}
    </>
  );
}

export function ReportDocument({ report, generatedAt }: ReportDocumentProps) {
  return (
    <article className={DOCUMENT_CLASS}>
      <header className="flex flex-col gap-1">
        <h1 className={TITLE_CLASS}>{REPORT_TITLE}</h1>
        <p className={MUTED_CLASS}>
          {GENERATED_ON_LABEL} {formatNoteFullTime(generatedAt)}
        </p>
        <div>
          <PrintButton />
        </div>
      </header>

      {report.entryCount === 0 ? (
        <p className={MUTED_CLASS}>{NO_DATA_LABEL}</p>
      ) : (
        <>
          <dl
            className={cn(
              "grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1 rounded-md border p-3 text-sm",
              BORDER_CLASS,
            )}
          >
            <dt className={MUTED_CLASS}>{PERIOD_SECTION_TITLE}</dt>
            <dd>{formatReportPeriod(report)}</dd>
            <dt className={MUTED_CLASS}>{SUMMARY_PROJECTS_LABEL}</dt>
            <dd className="wrap-anywhere">
              {report.projectNames.join(PROJECT_NAMES_SEPARATOR)}
            </dd>
            <dt className={MUTED_CLASS}>{SUMMARY_ENTRIES_LABEL}</dt>
            <dd>{report.entryCount}</dd>
            <dt className={MUTED_CLASS}>{TOTAL_LABEL}</dt>
            <dd className="font-bold">
              {formatDecimalHours(report.totalHours)}
            </dd>
          </dl>

          {report.sections.map((section) => (
            <section key={section.grouping} className="break-inside-avoid">
              <h2 className={SECTION_TITLE_CLASS}>
                {GROUPING_LABELS[section.grouping]}
              </h2>
              <table className="w-full text-sm">
                <tbody>
                  <ReportRows rows={section.rows} depth={0} />
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <th
                      scope="row"
                      className={cn(CELL_CLASS, "border-t-2 text-left")}
                    >
                      {TOTAL_LABEL}
                    </th>
                    <td
                      className={cn(
                        CELL_CLASS,
                        "border-t-2 text-right whitespace-nowrap",
                      )}
                    >
                      {formatDecimalHours(section.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </section>
          ))}
        </>
      )}
    </article>
  );
}

export function ReportError({ message }: ReportErrorProps) {
  return (
    <article className={DOCUMENT_CLASS}>
      <h1 className={TITLE_CLASS}>{REPORT_INVALID_TITLE}</h1>
      <p className={MUTED_CLASS}>{message}</p>
    </article>
  );
}
