import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Suspense } from "react";
import { NavBar } from "./NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Message Generator",
  description: "Generate personalized outreach messages based on signals from company website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <SpeedInsights/>
      <body className="min-h-full flex">
        <Suspense fallback={<div className="w-48 shrink-0 border-r border-zinc-200 dark:border-zinc-800" />}>
          <NavBar />
        </Suspense>
        <div className="flex flex-col flex-1 min-w-0">
          {children}
        </div>
      </body>
    </html>
  );
}
