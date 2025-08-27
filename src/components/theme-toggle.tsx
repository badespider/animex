"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Avoid hydration mismatch by not relying on client-only theme state until mounted
  const dark = mounted && ((theme === "dark") || (theme === "system" && resolvedTheme === "dark"));
  const label = mounted ? (dark ? "Switch to light theme" : "Switch to dark theme") : "Toggle theme";

  return (
    <button
      type="button"
      suppressHydrationWarning
      aria-label={label}
      title={label}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="inline-flex items-center justify-center gap-2 px-3 py-1 border rounded transition-colors hover:bg-black/5 dark:hover:bg-white/10"
    >
      {mounted ? (
        dark ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />
      ) : (
        // During SSR/hydration, avoid mismatches: render a neutral placeholder
        <span className="w-4 h-4" aria-hidden />
      )}
      <span className="text-sm">Theme</span>
    </button>
  );
}

