import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("first_name").eq("id", user.id).single()
    : { data: null };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <SpeedInsights/>
      <body className="min-h-full flex">
        {user && (
          <nav className="fixed top-0 left-0 h-full w-48 flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black px-3 py-6">
            <div className="flex flex-col gap-1 flex-1">
              <Link href="/" className="rounded-md px-3 py-2 text-sm opacity-60 hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                Generate Message
              </Link>
              <Link href="/news" className="rounded-md px-3 py-2 text-sm opacity-60 hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                Funding News
              </Link>
            </div>
            <div className="flex flex-col gap-1">
              <p className="px-3 text-xs text-zinc-400 truncate">
                {profile?.first_name ?? user.email}
              </p>
              <SignOutButton />
            </div>
          </nav>
        )}
        <div className={`flex flex-col flex-1 ${user ? "ml-48" : ""}`}>
          {children}
        </div>
      </body>
    </html>
  );
}
