import { PropsWithChildren, ReactNode } from "react";
import { Footer } from "@/components/Footer";
import {
  SidebarInset,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export type ToolLayoutSlots = PropsWithChildren<{
  breadcrumb: ReactNode;
}>;

export type ToolLayoutProps = ToolLayoutSlots & {
  sidebar: ReactNode;
};

export function ToolLayout({ sidebar, breadcrumb, children }: ToolLayoutProps) {
  return (
    <div className="flex min-h-0 w-full flex-1">
      {sidebar}
      <SidebarInset className="bg-muted min-h-0">
        <div className="flex min-h-0 w-full min-w-md flex-1 flex-col">
          <div className="bg-sidebar border-sidebar-accent h-toolbar shadow-background/50 @container/toolbar relative z-10 flex shrink-0 flex-row items-center gap-2 border-b shadow-sm">
            <SidebarTrigger size="icon-lg" />
            <SidebarSeparator
              orientation="vertical"
              className="mt-3 hidden data-[orientation=vertical]:h-4 @3xl/toolbar:block"
            />
            {breadcrumb}
          </div>
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {children}
            <Footer />
          </main>
        </div>
      </SidebarInset>
    </div>
  );
}
