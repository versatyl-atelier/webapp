import {
  getLanceurEmployees,
  getLanceurOptions,
  getLanceurRows,
  getPlanSettings,
} from "@/actions/lanceur";
import { getClosures } from "@/actions/lanceurSettings";
import { LanceurPlanner } from "@/components/LanceurPlanner";
import { LanceurSync } from "@/components/LanceurSync";
import { Role } from "@/generated/prisma/enums";
import { LanceurOptionField } from "@/generated/prisma/enums";
import { LANCEUR_PATH } from "@/constants/tools";
import { toLocalDateKey } from "@/lib/calendar";
import { requireActiveSession } from "@/lib/session";

export default async function Page() {
  const session = await requireActiveSession(LANCEUR_PATH);
  const [rows, settings, options, employees, closures] = await Promise.all([
    getLanceurRows(),
    getPlanSettings(),
    getLanceurOptions(),
    getLanceurEmployees(),
    session.role === Role.manager ? getClosures() : null,
  ]);
  const valuesOf = (field: LanceurOptionField) =>
    options
      .filter((option) => option.field === field)
      .map(({ value }) => value);

  return (
    <>
      <LanceurSync />
      <LanceurPlanner
        rows={rows}
        settings={settings}
        today={toLocalDateKey(new Date())}
        closures={closures}
        etapes={valuesOf(LanceurOptionField.etape)}
        installateurs={valuesOf(LanceurOptionField.installateur)}
        employees={employees}
      />
    </>
  );
}
