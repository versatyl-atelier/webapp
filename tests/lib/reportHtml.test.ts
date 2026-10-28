import { describe, expect, it } from "vitest";

import {
  escapeHtml,
  renderReportErrorHtml,
  renderReportHtml,
} from "@/lib/reportHtml";
import type { Report } from "@/lib/report";

const generatedAt = new Date("2026-10-28T18:05:00Z");

const report: Report = {
  start: "2026-10-01",
  end: null,
  projectNames: ["Gagné", "Fabrication"],
  entryCount: 3,
  totalHours: 7,
  sections: [
    {
      grouping: "project",
      total: 7,
      rows: [
        {
          key: "a",
          label: "Gagné",
          hours: 6,
          children: [
            {
              key: "s",
              label: "Armoire",
              hours: 6,
              children: [{ key: "x", label: "Atelier", hours: 6 }],
            },
          ],
        },
        { key: "b", label: "Fabrication", hours: 1 },
      ],
    },
  ],
};

describe("escapeHtml", () => {
  it("escapes the characters that could break out of the markup", () => {
    expect(escapeHtml(`<a href="x">Tom & 'Jerry'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/a&gt;",
    );
  });
});

describe("renderReportHtml", () => {
  it("is a complete document with a light color scheme", () => {
    const html = renderReportHtml(report, generatedAt);
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain('<html lang="fr-CA">');
    expect(html).toContain('<meta name="color-scheme" content="light">');
    expect(html).toContain("background: #ffffff");
  });

  it("shows the summary, the sections and their totals", () => {
    const html = renderReportHtml(report, generatedAt);
    expect(html).toContain("À partir du 2026-10-01");
    expect(html).toContain("Gagné, Fabrication");
    expect(html).toContain("Par projet");
    expect(html).toContain("<td>6.00 h</td>");
    expect(html).toContain("<td>7.00 h</td>");
  });

  it("indents each nesting level", () => {
    const html = renderReportHtml(report, generatedAt);
    expect(html).toContain('<th scope="row" class="d0">Gagné</th>');
    expect(html).toContain('<th scope="row" class="d1">Armoire</th>');
    expect(html).toContain('<th scope="row" class="d2">Atelier</th>');
  });

  it("escapes names coming from the database", () => {
    const html = renderReportHtml(
      {
        ...report,
        projectNames: ["<script>alert(1)</script>"],
        sections: [
          {
            grouping: "project",
            total: 1,
            rows: [
              { key: "x", label: "<img src=x onerror=alert(1)>", hours: 1 },
            ],
          },
        ],
      },
      generatedAt,
    );
    expect(html).not.toContain("<script>alert(1)");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });

  it("says so when the selection has no time entries", () => {
    const html = renderReportHtml(
      { ...report, entryCount: 0, totalHours: 0, sections: [] },
      generatedAt,
    );
    expect(html).toContain("Aucune entrée de temps pour cette sélection");
    expect(html).not.toContain("<table>");
  });
});

describe("renderReportErrorHtml", () => {
  it("shows the message as text", () => {
    const html = renderReportErrorHtml("Date <invalide>");
    expect(html).toContain("Date &lt;invalide&gt;");
  });
});
