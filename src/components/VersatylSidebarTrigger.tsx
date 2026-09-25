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
        "bg-sidebar border-sidebar-accent fixed z-10 rounded-l-none border pt-2",
        className,
      )}
    />
  );
}
