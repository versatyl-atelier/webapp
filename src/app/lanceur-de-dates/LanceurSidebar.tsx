import { LanceurNav } from "@/components/LanceurNav";
import { ToolSidebar } from "@/components/ToolSidebar";
import { SidebarContent } from "@/components/ui/sidebar";
import { LANCEUR_LABEL } from "@/constants/lanceur";
import { LANCEUR_PATH } from "@/constants/tools";

export async function LanceurSidebar() {
  return (
    <ToolSidebar glyph="☄️" title={LANCEUR_LABEL} href={LANCEUR_PATH}>
      <SidebarContent>
        <LanceurNav />
      </SidebarContent>
    </ToolSidebar>
  );
}
