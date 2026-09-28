import { ToolSidebar } from "@/components/ToolSidebar";
import { SidebarContent } from "@/components/ui/sidebar";
import { CALENDAR_PATH, CALENDAR_TITLE } from "@/constants/calendar";

export function CalendrierSidebar() {
  return (
    <ToolSidebar glyph="🗓" title={CALENDAR_TITLE} href={CALENDAR_PATH}>
      <SidebarContent />
    </ToolSidebar>
  );
}
