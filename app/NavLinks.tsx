"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SoundLink from "./SoundLink";

export default function NavLinks() {
  const pathname = usePathname();

  const navLink = (href: string, label: string) => {
    const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return (
      <Link
        key={href}
        href={href}
        className={`rounded-lg px-3 py-2 text-sm transition-colors ${
          isActive
            ? "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 font-medium"
            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
        }`}
      >
        {label}
      </Link>
    );
  };

  const todayActive = pathname === "/action-items";

  return (
    <>
      <SoundLink
        href="/action-items"
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          todayActive
            ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
        }`}
      >
        Today
      </SoundLink>
      {navLink("/signals", "Signals")}
      {navLink("/", "Write Message")}
      {navLink("/call-prep", "Prep Call")}
    </>
  );
}
