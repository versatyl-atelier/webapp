import { ToolLayout, ToolLayoutSlots } from "@/components/ToolLayout";
import { GestionnaireSidebar } from "./GestionnaireSidebar";

export default function GestionnaireLayout({
  children,
  breadcrumb,
}: ToolLayoutSlots) {
  return (
    <ToolLayout sidebar={<GestionnaireSidebar />} breadcrumb={breadcrumb}>
      {children}
    </ToolLayout>
  );
}
