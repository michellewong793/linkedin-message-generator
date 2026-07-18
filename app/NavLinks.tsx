"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLinks() {
  const pathname = usePathname();

  const navLink = (href: string, label: string) => {
    const isActive = pathname.startsWith(href);
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

  return <>{navLink("/hot-hobbies", "Hot Hobbies")}</>;
}
