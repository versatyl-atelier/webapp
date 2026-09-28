import { PropsWithChildren, ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { isOpen } from "@/lib/sidebar";

export type ToolLayoutSlots = PropsWithChildren<{
  breadcrumb: ReactNode;
}>;

type ToolLayoutProps = ToolLayoutSlots & {
  sidebar: ReactNode;
};

export async function ToolLayout({
  sidebar,
  breadcrumb,
  children,
}: ToolLayoutProps) {
  const isSidebarOpen = await isOpen();

  return (
    <SidebarProvider defaultOpen={isSidebarOpen}>
      {sidebar}
      <SidebarInset className="bg-punch-light">
        <div className="flex min-h-screen w-full min-w-md flex-col">
          <div className="bg-sidebar border-sidebar-accent fixed z-10 flex w-full items-center gap-2 border">
            <SidebarTrigger size="icon-lg" />
            {breadcrumb}
          </div>
          <main className="flex max-h-[calc(100svh-20*var(--spacing))] min-h-0 flex-1 flex-col pt-9">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
