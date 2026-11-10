import {
  getImportableProjects,
  getLanceurEmployees,
  getLanceurOptions,
  getLanceurRows,
} from "@/actions/lanceur";
import { LanceurAddPhase } from "@/components/LanceurAddPhase";
import { LanceurOptionsDialog } from "@/components/LanceurOptionsDialog";
import { LanceurSync } from "@/components/LanceurSync";
import { LanceurTable } from "@/components/LanceurTable";
import { PrintButton } from "@/components/PrintButton";
import {
  LANCEUR_ACTIVE_PROJECTS_PLURAL,
  LANCEUR_ACTIVE_PROJECTS_SINGULAR,
  LANCEUR_GENERATED_PREFIX,
  LANCEUR_LOCALE,
  LANCEUR_PRINT_FOOTER,
  LANCEUR_PRINT_SUBTITLE,
  LANCEUR_TABLE_TITLE,
  LANCEUR_TABLEAU_PATH,
} from "@/constants/lanceur";
import { LanceurOptionField } from "@/generated/prisma/enums";
import { toLocalDateKey } from "@/lib/calendar";
import { requireActiveSession } from "@/lib/session";

export default async function Page() {
  await requireActiveSession(LANCEUR_TABLEAU_PATH);
  const [rows, options, employees, importableProjects] = await Promise.all([
    getLanceurRows(),
    getLanceurOptions(),
    getLanceurEmployees(),
    getImportableProjects(),
  ]);
  const now = new Date();
  const valuesOf = (field: LanceurOptionField) =>
    options
      .filter((option) => option.field === field)
      .map(({ value }) => value);

  return (
    <div className="flex flex-col gap-4 p-4 print:gap-3 print:p-0">
      <LanceurSync />
      <header className="border-foreground flex flex-wrap items-start justify-between gap-2 border-b-2 pb-3">
        <div>
          <h1 className="text-lg font-bold">{LANCEUR_TABLE_TITLE}</h1>
          <p className="text-muted-foreground text-xs">
            {LANCEUR_PRINT_SUBTITLE}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-muted-foreground text-right text-xs leading-relaxed">
            {LANCEUR_GENERATED_PREFIX}{" "}
            {now.toLocaleDateString(LANCEUR_LOCALE, { dateStyle: "long" })}
            <br />
            {rows.length}{" "}
            {rows.length > 1
              ? LANCEUR_ACTIVE_PROJECTS_PLURAL
              : LANCEUR_ACTIVE_PROJECTS_SINGULAR}
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <LanceurAddPhase projects={importableProjects} />
            <LanceurOptionsDialog options={options} />
            <PrintButton />
          </div>
        </div>
      </header>
      <LanceurTable
        rows={rows}
        employees={employees}
        etapes={valuesOf(LanceurOptionField.etape)}
        installateurs={valuesOf(LanceurOptionField.installateur)}
        today={toLocalDateKey(now)}
      />
      <p className="text-muted-foreground text-2xs hidden text-right print:block">
        {LANCEUR_PRINT_FOOTER} ·{" "}
        {now.toLocaleDateString(LANCEUR_LOCALE, { dateStyle: "long" })}
      </p>
    </div>
  );
}
