import { ToolLayout, ToolLayoutSlots } from "@/components/ToolLayout";
import { CalendarFiltersProvider } from "@/contexts/calendar-filters-provider";
import { CalendrierSidebar } from "./CalendrierSidebar";

export default function CalendrierLayout({
  children,
  breadcrumb,
}: ToolLayoutSlots) {
  return (
    <CalendarFiltersProvider>
      <ToolLayout sidebar={<CalendrierSidebar />} breadcrumb={breadcrumb}>
        {children}
      </ToolLayout>
    </CalendarFiltersProvider>
  );
}
