import { ToolLayout, ToolLayoutSlots } from "@/components/ToolLayout";
import { LanceurSidebar } from "./LanceurSidebar";

export default function LanceurLayout({
  children,
  breadcrumb,
}: ToolLayoutSlots) {
  return (
    <ToolLayout sidebar={<LanceurSidebar />} breadcrumb={breadcrumb}>
      {children}
    </ToolLayout>
  );
}
