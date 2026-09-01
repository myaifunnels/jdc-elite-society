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
      className="glass-icon-btn pressable flex h-11 w-11 items-center justify-center rounded-full text-[var(--chrome-bright)] transition hover:border-[var(--brand)]"
    >
      {!mounted ? <Sparkles size={18} /> : isDark ? <SunMedium size={18} /> : <Moon size={18} />}
    </button>
  );
}
