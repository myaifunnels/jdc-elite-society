import Link from "next/link";

import { JdcWordmark } from "@/components/branding/jdc-wordmark";
import { LogoImage } from "@/components/branding/logo-image";
import { BrandingSettings, resolveLogoHref } from "@/lib/branding";
import { cn } from "@/lib/utils";

export function SiteLogo({
  branding,
  href,
  compact = false,
  inverted = false,
}: {
  branding: BrandingSettings;
  href?: string;
  compact?: boolean;
  inverted?: boolean;
}) {
  const safeHref = resolveLogoHref(href ?? "/", branding.logoUrl);
  const isExternal = safeHref.startsWith("http");
  const className = cn(
    "site-logo pressable inline-flex min-h-11 min-w-0 items-center gap-3 rounded-2xl pr-2 text-left",
    inverted && "text-white",
  );
  const label = branding.logoAlt || "Coach JDC";

  const content = (
    <>
      {branding.logoUrl ? (
        <LogoImage src={branding.logoUrl} alt={branding.logoAlt || "Coach JDC"} compact={compact} />
      ) : (
        <JdcWordmark compact={compact} />
      )}
      {!compact ? (
        <span className="min-w-0">
          <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[var(--chrome)]">
            coachjdc.org
          </span>
          <span className="block truncate text-sm font-semibold tracking-[-0.01em] text-[var(--heading)]">
            Coach Jayson Dela Cruz
          </span>
        </span>
      ) : null}
    </>
  );

  if (isExternal) {
    return (
      <a
        href={safeHref}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={label}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={safeHref} className={className} aria-label={label}>
      {content}
    </Link>
  );
}
