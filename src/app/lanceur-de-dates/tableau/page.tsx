import {
  getAvailablePhases,
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
  LANCEUR_GENERATED_PREFIX,
  LANCEUR_LOCALE,
  LANCEUR_TABLE_TITLE,
  LANCEUR_TABLEAU_PATH,
} from "@/constants/lanceur";
import { LanceurOptionField } from "@/generated/prisma/enums";
import { toLocalDateKey } from "@/lib/calendar";
import { requireActiveSession } from "@/lib/session";

export default async function Page() {
  await requireActiveSession(LANCEUR_TABLEAU_PATH);
  const [rows, options, employees, availablePhases] = await Promise.all([
    getLanceurRows(),
    getLanceurOptions(),
    getLanceurEmployees(),
    getAvailablePhases(),
  ]);
  const now = new Date();
  const valuesOf = (field: LanceurOptionField) =>
    options
      .filter((option) => option.field === field)
      .map(({ value }) => value);

  return (
    <div className="flex flex-col gap-4 p-4 print:p-0">
      <LanceurSync />
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold">{LANCEUR_TABLE_TITLE}</h1>
          <p className="text-muted-foreground text-xs">
            {LANCEUR_GENERATED_PREFIX}{" "}
            {now.toLocaleDateString(LANCEUR_LOCALE, { dateStyle: "long" })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <LanceurAddPhase phases={availablePhases} />
          <LanceurOptionsDialog options={options} />
          <PrintButton />
        </div>
      </header>
      <LanceurTable
        rows={rows}
        employees={employees}
        etapes={valuesOf(LanceurOptionField.etape)}
        installateurs={valuesOf(LanceurOptionField.installateur)}
        today={toLocalDateKey(now)}
      />
    </div>
  );
}
