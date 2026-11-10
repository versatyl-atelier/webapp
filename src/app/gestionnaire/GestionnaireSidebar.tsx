import { ToolNav } from "@/components/ToolNav";
import { ToolSidebar } from "@/components/ToolSidebar";
import { SidebarContent } from "@/components/ui/sidebar";
import { MANAGER_NAV_ITEMS, MANAGER_TOOL } from "@/constants/tools";

export function GestionnaireSidebar() {
  return (
    <ToolSidebar
      glyph={MANAGER_TOOL.icon}
      title={MANAGER_TOOL.title}
      href={MANAGER_TOOL.href}
    >
      <SidebarContent>
        <ToolNav items={MANAGER_NAV_ITEMS} />
      </SidebarContent>
    </ToolSidebar>
  );
}
