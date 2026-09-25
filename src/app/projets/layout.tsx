import { ToolLayout, ToolLayoutProps } from "@/components/ToolLayout";
import { ProjetsSidebar } from "./ProjetsSidebar";

export default function ProjetsLayout({
  children,
  breadcrumb,
}: ToolLayoutProps) {
  return (
    <ToolLayout sidebar={<ProjetsSidebar />} breadcrumb={breadcrumb}>
      {children}
    </ToolLayout>
  );
}
