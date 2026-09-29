import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import pkg from "@/../package.json";
import { Header } from "@/components/Header";
import { AuthEventsProvider } from "@/contexts/auth-events-provider";
import { ThemeProvider } from "@/contexts/theme-provider";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { isOpen } from "@/lib/sidebar";

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

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full font-sans antialiased`}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthEventsProvider>
            <TooltipProvider>
              <SidebarProvider defaultOpen={isSidebarOpen}>
                <AppSidebar />
                <SidebarInset>
                  <Header />
                  {children}
                </SidebarInset>
              </SidebarProvider>
            </TooltipProvider>
            <footer className="text-muted-foreground fixed bottom-0 mt-4 mb-2 w-full text-center text-[10px] print:mt-4">
              Version {pkg.version} - Atelier Versatyl © 2025
            </footer>
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
      </body>
    </html>
  );
}
