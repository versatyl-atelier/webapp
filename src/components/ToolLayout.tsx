import { PropsWithChildren, ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { VersatylSidebarTrigger } from "@/components/VersatylSidebarTrigger";
import { isOpen } from "@/lib/sidebar";

export type ToolLayoutProps = PropsWithChildren<{
  breadcrumb: ReactNode;
}>;

type Props = ToolLayoutProps & {
  sidebar: ReactNode;
};

export async function ToolLayout({ sidebar, breadcrumb, children }: Props) {
  const isSidebarOpen = await isOpen();

  return (
    <SidebarProvider defaultOpen={isSidebarOpen}>
      {sidebar}
      <SidebarInset>
        <div className="bg-punch-light flex min-h-screen w-full min-w-md flex-col">
          <VersatylSidebarTrigger />
          <div className="flex flex-row items-baseline">
            <div className="flex w-full flex-row justify-between px-8 py-2">
              <div className="ml-2">{breadcrumb}</div>
            </div>
          </div>
          <main>{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
