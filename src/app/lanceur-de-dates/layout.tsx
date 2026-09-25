import { ToolLayout, ToolLayoutProps } from "@/components/ToolLayout";
import { LanceurSidebar } from "./LanceurSidebar";

export default function LanceurLayout({
  children,
  breadcrumb,
}: ToolLayoutProps) {
  return (
    <ToolLayout sidebar={<LanceurSidebar />} breadcrumb={breadcrumb}>
      {children}
    </ToolLayout>
  );
}
