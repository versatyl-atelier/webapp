import { ToolLayout, ToolLayoutProps } from "@/components/ToolLayout";

export default function ProjetsLayout({
  children,
  breadcrumb,
  sidebar,
}: ToolLayoutProps) {
  return (
    <ToolLayout sidebar={sidebar} breadcrumb={breadcrumb}>
      {children}
    </ToolLayout>
  );
}
