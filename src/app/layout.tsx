import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OutsideTools } from "@/components/OutsideTools";
import { AuthEventsProvider } from "@/contexts/auth-events-provider";
import { ThemeProvider } from "@/contexts/theme-provider";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getSession } from "@/lib/session";
import { isOpen } from "@/lib/sidebar";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WebApp Versatyl",
  description:
    "Application web pour les employés et gestionnaires de Versatyl Atelier",
};

export default async function RootLayout({
  children,
  modals,
}: Readonly<{
  children: React.ReactNode;
  modals: React.ReactNode;
}>) {
  const isSidebarOpen = await isOpen();
  const role = (await getSession())?.role ?? null;

  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full font-sans antialiased`}
    >
      <body className="bg-background text-foreground flex h-full flex-col overflow-hidden print:block print:h-auto print:overflow-visible">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthEventsProvider>
            <TooltipProvider>
              <SidebarProvider
                defaultOpen={isSidebarOpen}
                className="h-full print:h-auto"
              >
                <AppSidebar role={role} />
                <SidebarInset className="min-h-0 min-w-0 print:block">
                  <Header />
                  <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto print:block print:overflow-visible">
                    {children}
                    <OutsideTools>
                      <Footer />
                    </OutsideTools>
                  </div>
                </SidebarInset>
              </SidebarProvider>
            </TooltipProvider>
            {modals}
          </AuthEventsProvider>
          <Toaster
            toastOptions={{
              classNames: {
                toast: "cn-toast",
                title: "!font-bold !text-lg",
              },
            }}
          />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
