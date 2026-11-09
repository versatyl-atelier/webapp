import { getLanceurRows, getPlanSettings } from "@/actions/lanceur";
import { getClosures } from "@/actions/lanceurSettings";
import { LanceurPlanner } from "@/components/LanceurPlanner";
import { LanceurSync } from "@/components/LanceurSync";
import { Role } from "@/generated/prisma/enums";
import { LANCEUR_PATH } from "@/constants/tools";
import { toLocalDateKey } from "@/lib/calendar";
import { requireActiveSession } from "@/lib/session";

export default async function Page() {
  const session = await requireActiveSession(LANCEUR_PATH);
  const [rows, settings, closures] = await Promise.all([
    getLanceurRows(),
    getPlanSettings(),
    session.role === Role.manager ? getClosures() : null,
  ]);

  return (
    <>
      <LanceurSync />
      <LanceurPlanner
        rows={rows}
        settings={settings}
        today={toLocalDateKey(new Date())}
        closures={closures}
      />
    </>
  );
}
