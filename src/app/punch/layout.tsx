import { ToolLayout, ToolLayoutProps } from "@/components/ToolLayout";
import { PunchSidebar } from "./PunchSidebar";

export default function PunchLayout({ children, breadcrumb }: ToolLayoutProps) {
  return (
    <ToolLayout sidebar={<PunchSidebar />} breadcrumb={breadcrumb}>
      {children}
    </ToolLayout>
  );
}
