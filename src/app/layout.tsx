import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import pkg from "@/../package.json";
import Link from "next/link";
import { LogoutButton } from "@/components/Logout";
import { AuthEventsProvider } from "@/contexts/auth-events-provider";

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

export default function RootLayout({
  children,
  auth,
}: Readonly<{
  children: React.ReactNode;
  auth: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full font-sans antialiased`}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <AuthEventsProvider>
          <header className="fixed z-30 flex w-full justify-between bg-white px-4 py-2 shadow-sm">
            <div className="flex gap-2">
              <Link
                href="/"
                className="inline-block size-6 rounded-sm bg-black p-1 text-white"
              >
                <svg
                  viewBox="0 0 12 12"
                  className="size-full"
                  fill="currentColor"
                >
                  <rect x="1" y="1" width="4" height="4" rx="1" />
                  <rect x="7" y="1" width="4" height="4" rx="1" />
                  <rect x="1" y="7" width="4" height="4" rx="1" />
                  <rect x="7" y="7" width="4" height="4" rx="1" />
                </svg>
              </Link>
              <h1 className="inline-block font-bold">
                <Link href="/">Versatyl</Link>
              </h1>
            </div>
            <div className="my-auto">
              <LogoutButton />
            </div>
          </header>
          <div className="py-10">{children}</div>
          <footer className="fixed bottom-0 mt-4 mb-2 w-full text-center text-[10px] text-gray-500 print:mt-4">
            Version {pkg.version} - Atelier Versatyl © 2025
          </footer>
          {auth}
        </AuthEventsProvider>
        <Toaster
          toastOptions={{
            classNames: {
              toast:
                "cn-toast !bg-punch-accent !border-2 !border-black !text-white",
              title: "!font-bold !text-lg",
            },
          }}
        />
      </body>
    </html>
  );
}
