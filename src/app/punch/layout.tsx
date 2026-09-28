import { ToolLayout, ToolLayoutSlots } from "@/components/ToolLayout";
import { PunchSidebar } from "./PunchSidebar";

export default function PunchLayout({ children, breadcrumb }: ToolLayoutSlots) {
  return (
    <ToolLayout sidebar={<PunchSidebar />} breadcrumb={breadcrumb}>
      {children}
    </ToolLayout>
  );
}
