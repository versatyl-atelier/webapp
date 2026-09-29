import { PropsWithChildren } from "react";

import { SidebarContent, SidebarFooter } from "@/components/ui/sidebar";
import Clock from "@/components/Clock";
import { ToolSidebar } from "@/components/ToolSidebar";

export async function PunchSidebar({ children }: PropsWithChildren) {
  return (
    <ToolSidebar glyph="⏱" title="Punch" href="/punch">
      <SidebarContent>{children}</SidebarContent>
      <SidebarFooter>
        <Clock className="text-center" />
      </SidebarFooter>
    </ToolSidebar>
  );
}
