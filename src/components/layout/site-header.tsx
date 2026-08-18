import Link from "next/link";

import { SiteLogo } from "@/components/branding/site-logo";
import { navItems, siteContent } from "@/data/site-content";
import { getResolvedBrandingSettings } from "@/lib/branding-store";
import { getSessionUser } from "@/lib/session";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export async function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const user = await getSessionUser();
  const branding = await getResolvedBrandingSettings();

  return (
    <header className={overlay ? "site-header site-header-overlay" : "site-header"}>
      <div className="container-shell flex items-center justify-between py-3">
        <div className="fade-up">
          <SiteLogo branding={branding} href="/" inverted={overlay} compact={Boolean(branding.logoUrl)} />
        </div>

        <nav className="site-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="pressable">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href={user ? "/dashboard" : "/contact"}
            className="button-primary pressable rounded-sm px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em]"
          >
            {user ? `${user.role} dashboard` : siteContent.headerCta}
          </Link>
        </div>
      </div>
    </header>
  );
}
