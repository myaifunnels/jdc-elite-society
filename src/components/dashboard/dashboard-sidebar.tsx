"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import {
  Clapperboard,
  Globe,
  GraduationCap,
  Handshake,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Plug,
  Settings2,
  Shield,
  UserRound,
  Users,
  Video,
  X,
  Zap,
} from "lucide-react";

import { logout } from "@/app/login/actions";
import { SiteLogo } from "@/components/branding/site-logo";
import { ContactAvatar } from "@/components/dashboard/contact-avatar";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { AccessMap, Capability, dashboardHomeHref } from "@/lib/access";
import { BrandingSettings } from "@/lib/branding";
import type { AppNotification } from "@/lib/notification-store";
import { DashboardRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const navCatalog: Array<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  capability: Capability;
}> = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, capability: "dashboard" },
  { href: "/dashboard/university", label: "University", icon: GraduationCap, capability: "university" },
  { href: "/dashboard/support", label: "Support", icon: MessageCircle, capability: "support" },
  { href: "/dashboard/profile", label: "Account", icon: UserRound, capability: "profile" },
  { href: "/dashboard/inbox", label: "Inbox", icon: Inbox, capability: "inbox" },
  { href: "/dashboard/contacts", label: "Contacts", icon: Users, capability: "contacts.view" },
  { href: "/dashboard/partnership", label: "Partnership", icon: Handshake, capability: "partnership" },
  { href: "/dashboard/access", label: "Access", icon: Shield, capability: "access" },
  { href: "/dashboard/integrations", label: "Integrations", icon: Plug, capability: "integrations" },
  { href: "/dashboard/automation", label: "Automation", icon: Zap, capability: "automation" },
  { href: "/dashboard/webinars", label: "Webinars", icon: Clapperboard, capability: "webinars" },
  { href: "/dashboard/my-webinars", label: "Webinars", icon: Video, capability: "myWebinars" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings2, capability: "settings" },
];

function navItems(access: AccessMap) {
  return navCatalog.filter((item) => {
    if (item.href === "/dashboard/contacts") {
      return access["contacts.view"] || access.registrations;
    }
    return access[item.capability];
  });
}

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarPanel({
  role,
  userName,
  userEmail,
  userPhotoUrl,
  membershipLabel,
  accountStatus,
  hasWebinarRegistrations,
  branding,
  access,
  notifications,
  titleId,
  onNavigate,
  showClose = false,
}: {
  role: DashboardRole;
  userName: string;
  userEmail?: string;
  userPhotoUrl?: string;
  membershipLabel: string;
  accountStatus?: string;
  hasWebinarRegistrations?: boolean;
  branding: BrandingSettings;
  access: AccessMap;
  notifications: AppNotification[];
  titleId: string;
  onNavigate?: () => void;
  showClose?: boolean;
}) {
  const pathname = usePathname();
  const homeHref = dashboardHomeHref(access, hasWebinarRegistrations);

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
        <SiteLogo branding={branding} href={homeHref} compact />
      </div>

      <div className="dashboard-sidebar-profile px-4 pb-4">
        <ContactAvatar name={userName} photoUrl={userPhotoUrl} size="lg" />
        <div className="min-w-0 max-w-full text-center">
          <p className="truncate text-base font-semibold">{userName}</p>
          {userEmail ? <p className="truncate text-xs text-[var(--muted)]">{userEmail}</p> : null}
          <p
            id={titleId}
            className="mt-1.5 truncate text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]"
          >
            {role === "member" || role === "contact" ? membershipLabel : role} workspace
          </p>
        </div>
      </div>

      <nav aria-label="Dashboard" className="mt-3 grid gap-1.5 px-3">
        {navItems(access).map((item) => {
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
              <Icon size={18} aria-hidden />
              {item.label}
            </Link>
          );
        })}
        <Link href="/" onClick={onNavigate} className="dashboard-nav-item pressable">
          <Globe size={18} aria-hidden />
          Back to main website
        </Link>
      </nav>

      <div className="mt-auto grid gap-3 border-t border-[var(--line)] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-xs font-semibold text-[var(--muted)]">
            {role === "member" || role === "contact"
              ? `${role} · ${accountStatus === "verified" ? "Verified" : "Pending"}`
              : role}
          </p>
          <div className="flex items-center gap-1">
            <NotificationBell items={notifications} />
          </div>
        </div>

        <form action={logout} className="w-full">
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
  userEmail,
  userPhotoUrl,
  membershipLabel,
  accountStatus,
  hasWebinarRegistrations,
  branding,
  access,
  notifications,
}: {
  role: DashboardRole;
  userName: string;
  userEmail?: string;
  userPhotoUrl?: string;
  membershipLabel: string;
  accountStatus?: string;
  hasWebinarRegistrations?: boolean;
  branding: BrandingSettings;
  access: AccessMap;
  notifications: AppNotification[];
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
        <SiteLogo branding={branding} href={dashboardHomeHref(access, hasWebinarRegistrations)} compact />
        <div className="flex items-center gap-2">
          <NotificationBell items={notifications} />
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
          "dashboard-sidebar fixed inset-y-0 left-0 z-50 flex w-[18.5rem] flex-col overflow-y-auto transition-transform duration-200 ease-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <span className="dashboard-sidebar-glow-mid" aria-hidden />
        <SidebarPanel
          role={role}
          userName={userName}
          userEmail={userEmail}
          userPhotoUrl={userPhotoUrl}
          membershipLabel={membershipLabel}
          accountStatus={accountStatus}
          hasWebinarRegistrations={hasWebinarRegistrations}
          branding={branding}
          access={access}
          notifications={notifications}
          titleId={titleId}
          onNavigate={close}
          showClose
        />
      </aside>

      <aside
        aria-labelledby={`${titleId}-desktop`}
        className="dashboard-sidebar hidden w-[19.5rem] shrink-0 flex-col overflow-y-auto lg:flex"
      >
        <span className="dashboard-sidebar-glow-mid" aria-hidden />
        <SidebarPanel
          role={role}
          userName={userName}
          userEmail={userEmail}
          userPhotoUrl={userPhotoUrl}
          membershipLabel={membershipLabel}
          accountStatus={accountStatus}
          hasWebinarRegistrations={hasWebinarRegistrations}
          branding={branding}
          access={access}
          notifications={notifications}
          titleId={`${titleId}-desktop`}
        />
      </aside>
    </>
  );
}
