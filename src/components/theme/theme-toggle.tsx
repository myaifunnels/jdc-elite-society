"use client";

import { Moon, Sparkles, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="pressable flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] bg-[color:var(--surface-elevated)]/80 text-[var(--foreground)] shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl transition hover:border-[var(--line-strong)]"
    >
      {!mounted ? <Sparkles size={18} /> : isDark ? <SunMedium size={18} /> : <Moon size={18} />}
    </button>
  );
}
