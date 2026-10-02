import { Suspense } from "react";

import { ProductionPipeline } from "@/components/ProductionPipeline";
import { ProductionPipelineSkeleton } from "@/components/ProductionPipelineSkeleton";
import { TodayEvents } from "@/components/TodayEvents";
import { TodayEventsSkeleton } from "@/components/TodayEventsSkeleton";
import { ToolTiles } from "@/components/ToolTiles";
import { UpcomingDeliveries } from "@/components/UpcomingDeliveries";
import { UpcomingDeliveriesSkeleton } from "@/components/UpcomingDeliveriesSkeleton";
import { APPLICATIONS_HEADING, PIPELINE_HEADING } from "@/constants/home";
import { Role } from "@/generated/prisma/enums";
import { toLocalDateKey } from "@/lib/calendar";
import { getSession } from "@/lib/session";

const SECTION_HEADING_CLASS =
  "text-muted-foreground my-4 text-xs font-bold uppercase";

export default async function Home() {
  const session = await getSession();
  const isManager = session?.role === Role.manager;
  const showWidgets = !!session && !session.mustChangePassword;
  const today = toLocalDateKey(new Date());

  return (
    <main className="min-w-0 px-4 pb-12">
      {showWidgets && (
        <>
          <section aria-labelledby="pipeline-heading">
            <h2 id="pipeline-heading" className={SECTION_HEADING_CLASS}>
              {PIPELINE_HEADING}
            </h2>
            <Suspense fallback={<ProductionPipelineSkeleton today={today} />}>
              <ProductionPipeline today={today} />
            </Suspense>
          </section>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Suspense fallback={<UpcomingDeliveriesSkeleton />}>
              <UpcomingDeliveries today={today} />
            </Suspense>
            <Suspense fallback={<TodayEventsSkeleton today={today} />}>
              <TodayEvents today={today} />
            </Suspense>
          </div>
        </>
      )}
      <section aria-labelledby="applications-heading">
        <h2 id="applications-heading" className={SECTION_HEADING_CLASS}>
          {APPLICATIONS_HEADING}
        </h2>
        <ToolTiles isManager={isManager} />
      </section>
    </main>
  );
}
