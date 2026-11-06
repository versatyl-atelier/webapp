import { PropsWithChildren } from "react";

import { NewProjectButton } from "@/components/NewProjectButton";
import { ToolSidebar } from "@/components/ToolSidebar";
import {
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
} from "@/components/ui/sidebar";

export async function ProjetsSidebar({ children }: PropsWithChildren) {
  return (
    <ToolSidebar glyph="📁" title="Projets" href="/projets">
      <SidebarContent>{children}</SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <NewProjectButton />
        </SidebarMenu>
      </SidebarFooter>
    </ToolSidebar>
  );
}
