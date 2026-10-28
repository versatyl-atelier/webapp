import { PropsWithChildren } from "react";

import { SidebarContent } from "@/components/ui/sidebar";
import { ToolSidebar } from "@/components/ToolSidebar";

export async function PunchSidebar({ children }: PropsWithChildren) {
  return (
    <ToolSidebar glyph="⏱" title="Punch" href="/punch">
      <SidebarContent>{children}</SidebarContent>
    </ToolSidebar>
  );
}
