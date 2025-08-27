"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/theme-toggle";

export default function SiteHeader() {
  const pathname = usePathname();

  const linkBase = "px-3 py-1 rounded hover:bg-black/5 dark:hover:bg-white/10";
  const active = "bg-black/10 dark:bg-white/10";

  return (
    <div className="sticky top-0 z-40 border-b bg-[var(--background)]/80 backdrop-blur">
      <div className="max-w-6xl mx-auto flex items-center gap-4 p-3">
        <Link href="/" className="font-bold text-lg">animex</Link>
        <nav className="flex items-center gap-2" aria-label="Primary">
          <Link className={`${linkBase} ${pathname === "/search" ? active : ""}`} href="/search">Search</Link>
          <Link className={`${linkBase} ${pathname === "/trending" ? active : ""}`} href="/trending">Trending</Link>
          <Link className={`${linkBase} ${pathname === "/popular" ? active : ""}`} href="/popular">Popular</Link>
          <Link className={`${linkBase} ${pathname === "/season" ? active : ""}`} href="/season">Season</Link>
          <Link className={`${linkBase} ${pathname === "/airing" ? active : ""}`} href="/airing">Airing</Link>
          <Link className={`${linkBase} ${pathname === "/favorites" ? active : ""}`} href="/favorites">Favorites</Link>
        </nav>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
