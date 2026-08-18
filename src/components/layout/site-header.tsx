import Link from "next/link";

import { navItems } from "@/data/site-content";
import { getSessionUser } from "@/lib/session";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[color:var(--background)]/72 backdrop-blur-2xl">
      <div className="container-shell flex items-center justify-between py-4">
        <div className="fade-up">
          <p className="eyebrow text-xs">
            Coach JDC
          </p>
          <p className="text-sm font-semibold tracking-[-0.01em]">Breakthrough platform</p>
        </div>

        <nav className="hidden gap-6 text-sm text-[var(--muted)] md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="pressable rounded-full px-3 py-2 transition hover:text-[var(--foreground)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href={user ? "/dashboard" : "/contact"}
            className="button-primary pressable rounded-full px-4 py-2 text-sm font-semibold"
          >
            {user ? `${user.role} dashboard` : "Inquire now"}
          </Link>
        </div>
      </div>
    </header>
  );
}
