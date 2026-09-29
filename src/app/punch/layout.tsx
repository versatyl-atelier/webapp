import { ToolLayout, ToolLayoutProps } from "@/components/ToolLayout";

export default function PunchLayout({
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
