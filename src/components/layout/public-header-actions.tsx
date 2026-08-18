"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { navItems } from "@/data/site-content";

export function PublicHeaderActions({
  overlay = false,
  ctaHref,
  ctaLabel,
}: {
  overlay?: boolean;
  ctaHref: string;
  ctaLabel: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 1024) {
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
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="pressable">
            {item.label}
          </Link>
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
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="pressable" onClick={() => setOpen(false)}>
            {item.label}
          </Link>
        ))}
        <Link href={ctaHref} className="button-primary pressable site-header-cta" onClick={() => setOpen(false)}>
          {ctaLabel}
        </Link>
      </div>
    </>
  );
}
