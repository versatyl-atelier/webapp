import { ToolLayout, ToolLayoutSlots } from "@/components/ToolLayout";
import { CalendrierSidebar } from "./CalendrierSidebar";

export default function CalendrierLayout({
  children,
  breadcrumb,
}: ToolLayoutSlots) {
  return (
    <ToolLayout sidebar={<CalendrierSidebar />} breadcrumb={breadcrumb}>
      {children}
    </ToolLayout>
  );
}
