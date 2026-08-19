"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import {
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Plug,
  Settings2,
  UserRound,
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
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/registrations", label: "Registrations", icon: ClipboardList },
    { href: "/dashboard/contacts", label: "Contacts", icon: Users },
    { href: "/dashboard/integrations", label: "Integrations", icon: Plug },
    { href: "/dashboard/settings", label: "Settings", icon: Settings2 },
  ],
  partner: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/contacts", label: "Contacts", icon: Users },
  ],
  member: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/profile", label: "Account profile", icon: UserRound },
    { href: "/dashboard/path", label: "My path", icon: BookOpen },
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
  membershipLabel,
  accountStatus,
  branding,
  titleId,
  onNavigate,
  showClose = false,
}: {
  role: DashboardRole;
  userName: string;
  membershipLabel: string;
  accountStatus?: string;
  branding: BrandingSettings;
  titleId: string;
  onNavigate?: () => void;
  showClose?: boolean;
}) {
  const pathname = usePathname();

  return (
    <>
      {showClose ? (
        <div className="dashboard-sidebar-head">
          <button
            type="button"
            className="glass-icon-btn pressable inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full"
            onClick={onNavigate}
          >
            <X size={16} />
            <span className="sr-only">Close navigation</span>
          </button>
        </div>
      ) : null}

      <div className="px-3 pb-3">
        <SiteLogo branding={branding} href="/dashboard" compact />
      </div>

      <div className="px-4">
        <p id={titleId} className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
          {role === "member" ? membershipLabel : role} workspace
        </p>
      </div>

      <nav aria-label="Dashboard" className="mt-3 grid gap-1 px-2">
        {navByRole[role].map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={cn("dashboard-nav-item pressable", active && "is-active")}
            >
              <Icon size={16} aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto grid gap-3 border-t border-[var(--line)] p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{userName}</p>
            <p className="truncate text-xs text-[var(--muted)]">
              {role === "member"
                ? `${membershipLabel} · ${accountStatus === "verified" ? "Verified" : "Pending"}`
                : role}
            </p>
          </div>
          <ThemeToggle />
        </div>

        <Link href="/" onClick={onNavigate} className="dashboard-nav-item pressable">
          View public site
        </Link>

        <form action={logout}>
          <button type="submit" className="macos-btn macos-btn-secondary pressable w-full gap-2">
            <LogOut size={14} aria-hidden />
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
  membershipLabel,
  accountStatus,
  branding,
}: {
  role: DashboardRole;
  userName: string;
  membershipLabel: string;
  accountStatus?: string;
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
      <div className="dashboard-mobile-bar sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 lg:hidden">
        <SiteLogo branding={branding} href="/dashboard" compact />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="glass-icon-btn pressable inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full"
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
          "dashboard-sidebar fixed inset-y-0 left-0 z-50 flex w-[16.5rem] flex-col overflow-y-auto transition-transform duration-200 ease-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarPanel
          role={role}
          userName={userName}
          membershipLabel={membershipLabel}
          accountStatus={accountStatus}
          branding={branding}
          titleId={titleId}
          onNavigate={close}
          showClose
        />
      </aside>

      <aside
        aria-labelledby={`${titleId}-desktop`}
        className="dashboard-sidebar hidden w-[16.5rem] shrink-0 flex-col overflow-y-auto lg:flex"
      >
        <SidebarPanel
          role={role}
          userName={userName}
          membershipLabel={membershipLabel}
          accountStatus={accountStatus}
          branding={branding}
          titleId={`${titleId}-desktop`}
        />
      </aside>
    </>
  );
}
