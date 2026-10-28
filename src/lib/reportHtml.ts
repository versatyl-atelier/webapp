import {
  GENERATED_ON_LABEL,
  GROUPING_LABELS,
  NO_DATA_LABEL,
  PRINT_LABEL,
  REPORT_INVALID_TITLE,
  REPORT_TITLE,
  TOTAL_LABEL,
} from "@/constants/report";
import { APP_NAME } from "@/constants/tools";
import { formatNoteFullTime } from "@/lib/projectNotes";
import type { Report, ReportRow } from "@/lib/report";
import { formatDecimalHours } from "@/lib/time";

const MAX_INDENT_DEPTH = 2;

const REPORT_STYLES = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 24px; background: #ffffff; color: #111111; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; font-size: 14px; line-height: 1.4; }
  main { max-width: 820px; margin: 0 auto; }
  h1 { margin: 0 0 4px; font-size: 22px; }
  .generated { margin: 0 0 16px; color: #555555; font-size: 12px; }
  .summary { margin: 0 0 20px; padding: 12px 14px; border: 1px solid #999999; border-radius: 6px; }
  .summary dl { display: grid; grid-template-columns: auto 1fr; gap: 4px 14px; margin: 0; }
  .summary dt { color: #555555; }
  .summary dd { margin: 0; overflow-wrap: anywhere; }
  section { margin: 0 0 20px; break-inside: avoid; }
  h2 { margin: 0 0 6px; padding-bottom: 4px; border-bottom: 2px solid #111111; font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 4px 6px; border-top: 1px solid #cccccc; text-align: left; vertical-align: top; }
  td { text-align: right; white-space: nowrap; }
  .d0 { font-weight: 600; }
  .d1 { padding-left: 24px; font-weight: 400; }
  .d2 { padding-left: 42px; font-weight: 400; color: #333333; }
  tfoot th, tfoot td { border-top: 2px solid #111111; font-weight: 700; }
  button { margin: 0 0 16px; padding: 6px 14px; border: 1px solid #111111; border-radius: 4px; background: #ffffff; color: #111111; font: inherit; cursor: pointer; }
  .empty { color: #555555; }
  @page { margin: 15mm; }
  @media print {
    body { padding: 0; }
    button { display: none; }
  }
`;

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function periodLabel({ start, end }: Pick<Report, "start" | "end">): string {
  if (start && end) return `Du ${start} au ${end}`;
  if (start) return `À partir du ${start}`;
  if (end) return `Jusqu'au ${end}`;
  return "Toutes les dates";
}

function renderRows(rows: readonly ReportRow[], depth: number): string {
  const depthClass = `d${Math.min(depth, MAX_INDENT_DEPTH)}`;
  return rows
    .map(
      (row) =>
        `<tr><th scope="row" class="${depthClass}">${escapeHtml(row.label)}</th><td>${formatDecimalHours(row.hours)}</td></tr>` +
        (row.children ? renderRows(row.children, depth + 1) : ""),
    )
    .join("");
}

function renderSections(report: Report): string {
  return report.sections
    .map(
      (section) => `<section>
  <h2>${escapeHtml(GROUPING_LABELS[section.grouping])}</h2>
  <table>
    <tbody>${renderRows(section.rows, 0)}</tbody>
    <tfoot><tr><th scope="row">${TOTAL_LABEL}</th><td>${formatDecimalHours(section.total)}</td></tr></tfoot>
  </table>
</section>`,
    )
    .join("\n");
}

function renderDocument(title: string, body: string): string {
  return `<!doctype html>
<html lang="fr-CA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(title)} — ${escapeHtml(APP_NAME)}</title>
<style>${REPORT_STYLES}</style>
</head>
<body>
<main>
${body}
</main>
</body>
</html>
`;
}

export function renderReportHtml(report: Report, generatedAt: Date): string {
  const header = `<h1>${escapeHtml(REPORT_TITLE)}</h1>
<p class="generated">${escapeHtml(GENERATED_ON_LABEL)} ${escapeHtml(formatNoteFullTime(generatedAt))}</p>
<button type="button" onclick="window.print()">${escapeHtml(PRINT_LABEL)}</button>`;

  if (report.entryCount === 0) {
    return renderDocument(
      REPORT_TITLE,
      `${header}\n<p class="empty">${escapeHtml(NO_DATA_LABEL)}</p>`,
    );
  }

  const summary = `<div class="summary"><dl>
  <dt>Période</dt><dd>${escapeHtml(periodLabel(report))}</dd>
  <dt>Projets</dt><dd>${escapeHtml(report.projectNames.join(", "))}</dd>
  <dt>Entrées</dt><dd>${report.entryCount}</dd>
  <dt>${TOTAL_LABEL}</dt><dd><strong>${formatDecimalHours(report.totalHours)}</strong></dd>
</dl></div>`;

  return renderDocument(
    REPORT_TITLE,
    `${header}\n${summary}\n${renderSections(report)}`,
  );
}

export function renderReportErrorHtml(message: string): string {
  return renderDocument(
    REPORT_INVALID_TITLE,
    `<h1>${escapeHtml(REPORT_INVALID_TITLE)}</h1>\n<p class="empty">${escapeHtml(message)}</p>`,
  );
}
