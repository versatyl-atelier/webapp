import {
  getImportableProjects,
  getLanceurEmployees,
  getLanceurOptions,
} from "@/actions/lanceur";
import { LanceurIntakePanel } from "@/components/LanceurIntakePanel";
import { LanceurNav } from "@/components/LanceurNav";
import { ToolSidebar } from "@/components/ToolSidebar";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { LANCEUR_LABEL } from "@/constants/lanceur";
import { INTAKE_TITLE } from "@/constants/lanceurIntake";
import { LANCEUR_PATH } from "@/constants/tools";
import { LanceurOptionField } from "@/generated/prisma/enums";

export async function LanceurSidebar() {
  const [projects, options, employees] = await Promise.all([
    getImportableProjects(),
    getLanceurOptions(),
    getLanceurEmployees(),
  ]);
  const valuesOf = (field: LanceurOptionField) =>
    options
      .filter((option) => option.field === field)
      .map(({ value }) => value);

  return (
    <ToolSidebar glyph="☄️" title={LANCEUR_LABEL} href={LANCEUR_PATH}>
      <SidebarContent>
        <LanceurNav />
        <SidebarGroup>
          <SidebarGroupLabel>{INTAKE_TITLE}</SidebarGroupLabel>
          <SidebarGroupContent>
            <LanceurIntakePanel
              projects={projects}
              etapes={valuesOf(LanceurOptionField.etape)}
              installateurs={valuesOf(LanceurOptionField.installateur)}
              employees={employees}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </ToolSidebar>
  );
}
