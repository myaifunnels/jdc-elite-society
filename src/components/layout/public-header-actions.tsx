"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { navItems } from "@/data/site-content";
import { NavItem } from "@/lib/types";

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
          <Link key={child.href} href={child.href} className="site-nav-dropdown-link">
            {child.label}
          </Link>
        ))}
      </div>
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
            <Link key={child.href} href={child.href} className="pressable" onClick={onNavigate}>
              {child.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PublicHeaderActions({
  overlay = false,
  ctaHref,
  ctaLabel,
  signedIn = false,
}: {
  overlay?: boolean;
  ctaHref: string;
  ctaLabel: string;
  signedIn?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const items = signedIn
    ? navItems
    : [...navItems, { href: "/login", label: "Sign in" }];

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
        <Link href={ctaHref} className="button-primary pressable site-header-cta">
          {ctaLabel}
        </Link>
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
        <Link href={ctaHref} className="button-primary pressable site-header-cta" onClick={() => setOpen(false)}>
          {ctaLabel}
        </Link>
      </div>
    </>
  );
}
