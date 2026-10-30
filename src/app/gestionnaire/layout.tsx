import { ToolLayout, ToolLayoutSlots } from "@/components/ToolLayout";

export default function GestionnaireLayout({
  children,
  breadcrumb,
}: ToolLayoutSlots) {
  return (
    <ToolLayout sidebar={null} breadcrumb={breadcrumb}>
      {children}
    </ToolLayout>
  );
}
