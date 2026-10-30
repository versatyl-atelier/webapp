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
    <div className="flex min-h-0 w-full flex-1 print:block">
      {sidebar}
      <SidebarInset className="bg-muted min-h-0 min-w-0 print:block print:bg-white">
        <div className="flex min-h-0 w-full min-w-md flex-1 flex-col print:block print:min-w-0">
          <div className="bg-sidebar border-sidebar-accent h-toolbar shadow-background/50 @container/toolbar relative z-10 flex shrink-0 flex-row items-center gap-2 border-b shadow-sm print:hidden">
            <SidebarTrigger size="icon-lg" />
            <SidebarSeparator
              orientation="vertical"
              className="mt-3 hidden data-[orientation=vertical]:h-4 @3xl/toolbar:block"
            />
            {breadcrumb}
          </div>
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto print:block print:overflow-visible">
            {children}
            <Footer />
          </main>
        </div>
      </SidebarInset>
    </div>
  );
}
