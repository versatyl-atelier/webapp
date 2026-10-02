import { PropsWithChildren } from "react";

import { ToolSidebar } from "@/components/ToolSidebar";
import { Button } from "@/components/ui/button";
import {
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export async function ProjetsSidebar({ children }: PropsWithChildren) {
  return (
    <ToolSidebar glyph="📁" title="Projets" href="/projets">
      <SidebarContent>{children}</SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuButton asChild>
            <Button variant="default">+ Nouveau projet</Button>
          </SidebarMenuButton>
        </SidebarMenu>
      </SidebarFooter>
    </ToolSidebar>
  );
}
