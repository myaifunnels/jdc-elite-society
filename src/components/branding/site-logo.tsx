import Link from "next/link";

import { BrandingSettings, resolveLogoHref } from "@/lib/branding";
import { cn } from "@/lib/utils";

function JdcWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={cn("jdc-wordmark", compact && "is-compact")} aria-hidden="true">
      <span className="jdc-letter">j</span>
      <span className="jdc-letter">D</span>
      <span className="jdc-letter">C</span>
    </span>
  );
}

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
        // User-provided logo URLs can come from R2 or any public host.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={branding.logoUrl}
          alt={branding.logoAlt || "Coach JDC"}
          className="site-logo-image h-9 w-auto object-contain"
        />
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
