import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
type VersatylSidebarTriggerProps = {
  className?: string;
};
export function VersatylSidebarTrigger({
  className,
}: VersatylSidebarTriggerProps) {
  return (
    <SidebarTrigger
      size="icon"
      className={cn(
        "bg-sidebar border-sidebar-accent absolute rounded-l-none border",
        className,
      )}
    />
  );
}
