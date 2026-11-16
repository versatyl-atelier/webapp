import { HomeWidget } from "@/components/HomeWidget";
import { ToolTiles } from "@/components/ToolTiles";
import {
  APPLICATIONS_HEADING,
  DEFAULT_HOME_LAYOUT,
  HOME_WIDGET_WIDTH_CLASSES,
} from "@/constants/home";
import { toLocalDateKey } from "@/lib/calendar";
import { homeLayoutForRole } from "@/lib/home";
import { getSession } from "@/lib/session";
import { cn } from "@/lib/utils";

const SECTION_HEADING_CLASS =
  "text-muted-foreground my-4 text-xs font-bold uppercase";

export default async function Home() {
  const session = await getSession();
  const today = toLocalDateKey(new Date());

  return (
    <main className="min-w-0 px-4 pb-12">
      {session && !session.mustChangePassword && (
        <div className="mt-4 grid grid-cols-12 gap-4">
          {homeLayoutForRole(DEFAULT_HOME_LAYOUT, session.role).map(
            ({ widget, width }) => (
              <div
                key={widget}
                className={cn("min-w-0", HOME_WIDGET_WIDTH_CLASSES[width])}
              >
                <HomeWidget widget={widget} today={today} role={session.role} />
              </div>
            ),
          )}
        </div>
      )}
      {session?.role && (
        <section aria-labelledby="applications-heading">
          <h2 id="applications-heading" className={SECTION_HEADING_CLASS}>
            {APPLICATIONS_HEADING}
          </h2>
          <ToolTiles role={session.role} />
        </section>
      )}
    </main>
  );
}
