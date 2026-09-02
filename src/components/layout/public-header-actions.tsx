"use client";

import { ChevronDown, GraduationCap, LayoutDashboard, LogOut, Menu, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { logout } from "@/app/login/actions";
import { ContactAvatar } from "@/components/dashboard/contact-avatar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { navItems } from "@/data/site-content";
import { NavItem, NavSubItem } from "@/lib/types";

type AccountSummary = {
  name: string;
  email: string;
  photoUrl?: string;
};

function DesktopNavChild({ child }: { child: NavSubItem }) {
  if (!child.children?.length) {
    return (
      <Link href={child.href} className="site-nav-dropdown-link">
        {child.label}
      </Link>
    );
  }

  return (
    <div className="site-nav-subitem-group">
      <Link href={child.href} className="site-nav-dropdown-link site-nav-subitem-trigger">
        {child.label}
        <ChevronDown size={12} aria-hidden />
      </Link>
      <div className="site-nav-subdropdown">
        {child.children.map((grandchild) => (
          <Link key={grandchild.href} href={grandchild.href} className="site-nav-dropdown-link">
            {grandchild.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function DesktopNavItem({ item }: { item: NavItem }) {
  if (!item.children?.length) {
    return (
      <Link href={item.href} className="pressable">
        {item.label}
      </Link>
    );
  }

  return (
    <div className="site-nav-item-group">
      <Link href={item.href} className="pressable site-nav-item-trigger">
        {item.label}
        <ChevronDown size={14} aria-hidden />
      </Link>
      <div className="site-nav-dropdown">
        {item.children.map((child) => (
          <DesktopNavChild key={child.href} child={child} />
        ))}
      </div>
    </div>
  );
}

function MobileNavSubItem({ child, onNavigate }: { child: NavSubItem; onNavigate: () => void }) {
  const [expanded, setExpanded] = useState(false);

  if (!child.children?.length) {
    return (
      <Link href={child.href} className="pressable" onClick={onNavigate}>
        {child.label}
      </Link>
    );
  }

  return (
    <div className="site-nav-drawer-group site-nav-drawer-subgroup">
      <div className="site-nav-drawer-group-head">
        <Link href={child.href} className="pressable" onClick={onNavigate}>
          {child.label}
        </Link>
        <button
          type="button"
          className="site-nav-drawer-expand"
          aria-expanded={expanded}
          aria-label={expanded ? `Collapse ${child.label}` : `Expand ${child.label}`}
          onClick={() => setExpanded((current) => !current)}
        >
          <ChevronDown size={16} aria-hidden />
        </button>
      </div>
      {expanded ? (
        <div className="site-nav-drawer-children site-nav-drawer-subchildren">
          {child.children.map((grandchild) => (
            <Link key={grandchild.href} href={grandchild.href} className="pressable" onClick={onNavigate}>
              {grandchild.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MobileNavItem({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const [expanded, setExpanded] = useState(false);

  if (!item.children?.length) {
    return (
      <Link href={item.href} className="pressable" onClick={onNavigate}>
        {item.label}
      </Link>
    );
  }

  return (
    <div className="site-nav-drawer-group">
      <div className="site-nav-drawer-group-head">
        <Link href={item.href} className="pressable" onClick={onNavigate}>
          {item.label}
        </Link>
        <button
          type="button"
          className="site-nav-drawer-expand"
          aria-expanded={expanded}
          aria-label={expanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
          onClick={() => setExpanded((current) => !current)}
        >
          <ChevronDown size={16} aria-hidden />
        </button>
      </div>
      {expanded ? (
        <div className="site-nav-drawer-children">
          {item.children.map((child) => (
            <MobileNavSubItem key={child.href} child={child} onNavigate={onNavigate} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AccountMenu({ account, onNavigate }: { account: AccountSummary; onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function close() {
    setOpen(false);
    onNavigate?.();
  }

  return (
    <div ref={rootRef} className="site-account-menu">
      <button
        type="button"
        className="site-account-trigger"
        aria-expanded={open}
        aria-label={`Account menu for ${account.name}`}
        onClick={() => setOpen((current) => !current)}
      >
        <ContactAvatar name={account.name} photoUrl={account.photoUrl} size="sm" />
        <span className="site-account-trigger-copy">
          <strong>{account.name}</strong>
          <small>{account.email}</small>
        </span>
        <ChevronDown size={14} aria-hidden className="site-account-trigger-chevron" />
      </button>

      {open ? (
        <div className="site-account-dropdown" role="menu">
          <div className="site-account-dropdown-head">
            <ContactAvatar name={account.name} photoUrl={account.photoUrl} />
            <span>
              <strong>{account.name}</strong>
              <small>{account.email}</small>
            </span>
          </div>
          <Link href="/dashboard" className="site-account-dropdown-link" onClick={close}>
            <LayoutDashboard size={15} aria-hidden />
            Dashboard
          </Link>
          <Link href="/dashboard/university" className="site-account-dropdown-link" onClick={close}>
            <GraduationCap size={15} aria-hidden />
            University
          </Link>
          <Link href="/dashboard/profile" className="site-account-dropdown-link" onClick={close}>
            <UserRound size={15} aria-hidden />
            Account
          </Link>
          <form action={logout} className="site-account-signout">
            <button type="submit" className="site-account-dropdown-link is-danger">
              <LogOut size={15} aria-hidden />
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export function PublicHeaderActions({
  overlay = false,
  ctaHref,
  ctaLabel,
  account = null,
}: {
  overlay?: boolean;
  ctaHref: string;
  ctaLabel: string;
  account?: AccountSummary | null;
}) {
  const [open, setOpen] = useState(false);
  const signedIn = Boolean(account);
  const items = signedIn ? navItems : [...navItems, { href: "/login", label: "Sign in" }];

  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 1100) {
        setOpen(false);
      }
    }

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("nav-open", open);
    return () => document.body.classList.remove("nav-open");
  }, [open]);

  return (
    <>
      <nav className="site-nav-desktop">
        {items.map((item) => (
          <DesktopNavItem key={item.href} item={item} />
        ))}
      </nav>

      <div className="site-header-tools">
        <ThemeToggle />
        {account ? (
          <AccountMenu account={account} />
        ) : (
          <Link href={ctaHref} className="button-primary pressable site-header-cta">
            {ctaLabel}
          </Link>
        )}
        <button
          type="button"
          className={overlay ? "site-nav-toggle overlay" : "site-nav-toggle"}
          aria-expanded={open}
          aria-controls="mobile-site-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div id="mobile-site-nav" className={open ? "site-nav-drawer is-open" : "site-nav-drawer"} hidden={!open}>
        {items.map((item) => (
          <MobileNavItem key={item.href} item={item} onNavigate={() => setOpen(false)} />
        ))}
        {account ? (
          <div className="site-nav-drawer-account">
            <div className="site-account-dropdown-head">
              <ContactAvatar name={account.name} photoUrl={account.photoUrl} />
              <span>
                <strong>{account.name}</strong>
                <small>{account.email}</small>
              </span>
            </div>
            <Link href="/dashboard" className="pressable" onClick={() => setOpen(false)}>
              Dashboard
            </Link>
            <Link href="/dashboard/university" className="pressable" onClick={() => setOpen(false)}>
              University
            </Link>
            <Link href="/dashboard/profile" className="pressable" onClick={() => setOpen(false)}>
              Account
            </Link>
            <form action={logout} className="site-account-signout">
              <button type="submit" className="pressable site-nav-drawer-signout">
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <Link href={ctaHref} className="button-primary pressable site-header-cta" onClick={() => setOpen(false)}>
            {ctaLabel}
          </Link>
        )}
      </div>
    </>
  );
}
