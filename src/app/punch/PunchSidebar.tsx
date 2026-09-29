import { SidebarContent, SidebarFooter } from "@/components/ui/sidebar";
import Clock from "@/components/Clock";
import { ToolSidebar } from "@/components/ToolSidebar";

export async function PunchSidebar() {
  return (
    <ToolSidebar glyph="⏱" title="Punch" href="/punch">
      <SidebarContent></SidebarContent>
      <SidebarFooter>
        <Clock className="text-center" />
      </SidebarFooter>
    </ToolSidebar>
  );
}
