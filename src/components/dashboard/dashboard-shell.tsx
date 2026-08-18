import Link from "next/link";

import { logout } from "@/app/login/actions";
import { SiteFooter } from "@/components/layout/site-footer";
import { DashboardRole } from "@/lib/types";

const navByRole: Record<DashboardRole, { href: string; label: string }[]> = {
  admin: [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/leads", label: "Leads" },
    { href: "/dashboard/maps", label: "Maps" },
    { href: "/dashboard/integrations", label: "Integrations" },
    { href: "/dashboard/partners", label: "Partners" },
    { href: "/dashboard/settings", label: "Settings" },
  ],
  partner: [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/leads", label: "My leads" },
    { href: "/dashboard/partners", label: "Partner summary" },
  ],
};

export function DashboardShell({
  role,
  title,
  description,
  children,
}: {
  role: DashboardRole;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-[color:var(--background)]/72 backdrop-blur-2xl">
        <div className="container-shell flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="eyebrow text-xs">
              {role} dashboard
            </p>
            <h1 className="text-2xl font-semibold tracking-[-0.02em]">{title}</h1>
            <p className="text-sm text-[var(--muted)]">{description}</p>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="button-secondary pressable rounded-full px-4 py-2 text-sm font-medium"
            >
              Exit demo session
            </button>
          </form>
        </div>
      </header>

      <div className="container-shell grid gap-8 py-8 lg:grid-cols-[220px_1fr]">
        <aside className="glass-panel fade-up h-fit rounded-[2rem] p-5">
          <p className="mb-4 text-sm font-semibold">Workspace</p>
          <nav className="grid gap-2 text-sm">
            {navByRole[role].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="pressable rounded-2xl px-4 py-3 transition hover:bg-[color:var(--brand-soft)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main>{children}</main>
      </div>

      <SiteFooter />
    </div>
  );
}
