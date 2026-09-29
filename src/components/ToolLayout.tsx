import { PropsWithChildren, ReactNode } from "react";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export type ToolLayoutSlots = PropsWithChildren<{
  breadcrumb: ReactNode;
}>;

type ToolLayoutProps = ToolLayoutSlots & {
  sidebar: ReactNode;
};

export function ToolLayout({ sidebar, breadcrumb, children }: ToolLayoutProps) {
  return (
    <div className="flex w-full flex-1">
      {sidebar}
      <SidebarInset className="bg-muted">
        <div className="flex h-[calc(100svh-20*var(--spacing))] w-full min-w-md flex-col">
          <div className="bg-sidebar border-sidebar-accent h-toolbar sticky top-12 z-10 flex shrink-0 items-center gap-2 border-b">
            <SidebarTrigger size="icon-lg" />
            {breadcrumb}
          </div>
          <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        </div>
      </SidebarInset>
    </div>
  );
}
