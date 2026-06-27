import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import pkg from "@/../package.json";

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
  description: "Applications pour Versatyl Atelier",
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
        {children}
        <footer className="mt-4 mb-2 text-center text-[10px] text-gray-500 print:mt-4">
          Version {pkg.version} - Atelier Versatyl © 2025
        </footer>
        {auth}
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
