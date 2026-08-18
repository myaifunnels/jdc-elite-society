"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import {
  Handshake,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Plug,
  Settings2,
  Users,
  X,
} from "lucide-react";

import { logout } from "@/app/login/actions";
import { SiteLogo } from "@/components/branding/site-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { BrandingSettings } from "@/lib/branding";
import { DashboardRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const navByRole: Record<
  DashboardRole,
  { href: string; label: string; icon: typeof LayoutDashboard }[]
> = {
  admin: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/leads", label: "Leads", icon: Users },
    { href: "/dashboard/maps", label: "Maps", icon: Map },
    { href: "/dashboard/integrations", label: "Integrations", icon: Plug },
    { href: "/dashboard/partners", label: "Partners", icon: Handshake },
    { href: "/dashboard/settings", label: "Settings", icon: Settings2 },
  ],
  partner: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/leads", label: "My leads", icon: Users },
    { href: "/dashboard/partners", label: "Partner summary", icon: Handshake },
  ],
};

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarPanel({
  role,
  userName,
  branding,
  titleId,
  onNavigate,
  showClose = false,
}: {
  role: DashboardRole;
  userName: string;
  branding: BrandingSettings;
  titleId: string;
  onNavigate?: () => void;
  showClose?: boolean;
}) {
  const pathname = usePathname();

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-4">
        <SiteLogo branding={branding} href="/dashboard" compact />
        {showClose ? (
          <button
            type="button"
            className="pressable inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[var(--line)]"
            onClick={onNavigate}
          >
            <X size={18} />
            <span className="sr-only">Close navigation</span>
          </button>
        ) : null}
      </div>

      <div className="px-4 pt-5">
        <p id={titleId} className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
          {role} workspace
        </p>
      </div>

      <nav aria-label="Dashboard" className="mt-3 grid gap-1 px-3">
        {navByRole[role].map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={cn(
                "pressable inline-flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium transition",
                active
                  ? "bg-[var(--brand-soft)] text-[var(--foreground)]"
                  : "text-[var(--muted)] hover:bg-[color:var(--brand-soft)] hover:text-[var(--foreground)]",
              )}
            >
              <Icon size={18} aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto grid gap-3 border-t border-[var(--line)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{userName}</p>
            <p className="truncate text-xs capitalize text-[var(--muted)]">{role}</p>
          </div>
          <ThemeToggle />
        </div>

        <Link
          href="/"
          onClick={onNavigate}
          className="pressable inline-flex min-h-11 items-center justify-center rounded-2xl px-3 text-sm font-medium text-[var(--muted)] transition hover:bg-[color:var(--brand-soft)] hover:text-[var(--foreground)]"
        >
          View public site
        </Link>

        <form action={logout}>
          <button
            type="submit"
            className="button-secondary pressable inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-3 text-sm font-medium"
          >
            <LogOut size={16} aria-hidden />
            Sign out
          </button>
        </form>
      </div>
    </>
  );
}

export function DashboardSidebar({
  role,
  userName,
  branding,
}: {
  role: DashboardRole;
  userName: string;
  branding: BrandingSettings;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const media = window.matchMedia("(min-width: 1024px)");
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    const onViewportChange = () => {
      if (media.matches) {
        setOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    if (!media.matches) {
      document.body.style.overflow = "hidden";
    }

    window.addEventListener("keydown", onKeyDown);
    media.addEventListener("change", onViewportChange);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      media.removeEventListener("change", onViewportChange);
    };
  }, [open]);

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[color:var(--background)]/88 px-4 py-3 backdrop-blur-xl lg:hidden">
        <SiteLogo branding={branding} href="/dashboard" compact />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="pressable inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[var(--line)] bg-[color:var(--surface-elevated)]/80"
            aria-expanded={open}
            aria-controls="dashboard-sidebar-mobile"
            onClick={() => setOpen(true)}
          >
            <Menu size={18} />
            <span className="sr-only">Open navigation</span>
          </button>
        </div>
      </div>

      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 cursor-pointer bg-black/45 lg:hidden"
          onClick={close}
        />
      ) : null}

      <aside
        id="dashboard-sidebar-mobile"
        aria-labelledby={titleId}
        aria-hidden={!open}
        inert={!open}
        className={cn(
          "dashboard-sidebar fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col overflow-y-auto border-r border-[var(--line)] bg-[color:var(--surface-elevated)]/94 shadow-[var(--shadow-xl)] backdrop-blur-2xl transition-transform duration-200 ease-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarPanel
          role={role}
          userName={userName}
          branding={branding}
          titleId={titleId}
          onNavigate={close}
          showClose
        />
      </aside>

      <aside
        aria-labelledby={`${titleId}-desktop`}
        className="dashboard-sidebar fixed inset-y-0 left-0 z-40 hidden w-[17rem] flex-col overflow-y-auto border-r border-[var(--line)] bg-[color:var(--surface-elevated)]/94 shadow-[var(--shadow-xl)] backdrop-blur-2xl lg:flex"
      >
        <SidebarPanel
          role={role}
          userName={userName}
          branding={branding}
          titleId={`${titleId}-desktop`}
        />
      </aside>
    </>
  );
}
