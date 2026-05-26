import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full font-sans antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {children}
        <footer className="mt-4 text-center text-[10px] text-gray-500 print:mt-4">
          Version {pkg.version} - Atelier Versatyl © 2025
        </footer>
      </body>
    </html>
  );
}
