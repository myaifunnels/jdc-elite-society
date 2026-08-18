import Link from "next/link";

import { SiteLogo } from "@/components/branding/site-logo";
import { navItems } from "@/data/site-content";
import { getResolvedBrandingSettings } from "@/lib/branding-store";
import { getSessionUser } from "@/lib/session";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export async function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const user = await getSessionUser();
  const branding = await getResolvedBrandingSettings();

  return (
    <header className={overlay ? "site-header site-header-overlay" : "site-header"}>
      <div className="container-shell flex items-center justify-between py-4">
        <div className="fade-up">
          <SiteLogo branding={branding} inverted={overlay} compact={Boolean(branding.logoUrl)} />
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
