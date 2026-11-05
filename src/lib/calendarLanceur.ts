import { LANCEUR_CATEGORY, LANCEUR_FILTER_KEYS } from "@/constants/calendar";
import {
  LANCEUR_DATE_KINDS,
  LANCEUR_DATE_KIND_TITLES,
  LANCEUR_EVENT_HOUR,
  LANCEUR_EVENT_ID,
  LANCEUR_EVENT_TAG,
  type LanceurDateKind,
} from "@/constants/lanceurCalendar";
import { DEFAULT_EVENT_COLOR } from "@/constants/calendar";
import {
  compareOccurrences,
  type CalendarOccurrence,
  type DateKey,
} from "@/lib/calendar";
import {
  LANCEUR_FALLBACK_COLOR,
  LANCEUR_PHASE_SEPARATOR,
  LANCEUR_TABLEAU_PATH,
} from "@/constants/lanceur";
import { phaseLabel, type LanceurRow } from "@/lib/lanceur";

const DATE_FIELDS: Record<
  LanceurDateKind,
  "pdmDate" | "approvalDate" | "deliveryDate"
> = {
  pdm: "pdmDate",
  approval: "approvalDate",
  delivery: "deliveryDate",
};

export function lanceurOccurrences(
  rows: readonly LanceurRow[],
  from: DateKey,
  to: DateKey,
): CalendarOccurrence[] {
  return rows
    .flatMap((row) =>
      LANCEUR_DATE_KINDS.flatMap((kind) => {
        const date = row[DATE_FIELDS[kind]];
        if (date === null || date < from || date > to) {
          return [];
        }
        return [
          {
            key: `${LANCEUR_CATEGORY}-${row.phaseId}-${kind}`,
            eventId: LANCEUR_EVENT_ID,
            date,
            category: LANCEUR_CATEGORY,
            subcategory: LANCEUR_EVENT_TAG,
            title: `${phaseLabel(row)}${LANCEUR_PHASE_SEPARATOR}${LANCEUR_DATE_KIND_TITLES[kind]}`,
            detail: "",
            hour: LANCEUR_EVENT_HOUR,
            color: DEFAULT_EVENT_COLOR,
            allDay: true,
            href: LANCEUR_TABLEAU_PATH,
            filterKey: LANCEUR_FILTER_KEYS[kind],
            customColor: row.responsibleColor ?? LANCEUR_FALLBACK_COLOR,
          } satisfies CalendarOccurrence,
        ];
      }),
    )
    .toSorted(compareOccurrences);
}
