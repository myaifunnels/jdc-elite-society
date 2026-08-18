import Link from "next/link";

import { BrandingSettings, isSafeHref } from "@/lib/branding";
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
  const destination = href ?? branding.logoHref;
  const safeHref = isSafeHref(destination) ? destination : "/";
  const isExternal = safeHref.startsWith("http");
  const className = cn(
    "pressable inline-flex min-h-11 min-w-0 items-center gap-3 rounded-2xl pr-2 text-left",
    inverted && "text-white",
  );

  const content = (
    <>
      {branding.logoUrl ? (
        // User-provided logo URLs can come from R2 or any public host.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={branding.logoUrl}
          alt={branding.logoAlt || "Coach JDC"}
          className="h-9 w-auto max-w-[10.5rem] object-contain"
        />
      ) : (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--brand)] text-[0.68rem] font-bold tracking-[0.08em] text-white">
          JDC
        </span>
      )}
      {!branding.logoUrl || !compact ? (
        <span className="min-w-0">
          <span
            className={cn(
              "block text-[0.68rem] font-semibold uppercase tracking-[0.28em]",
              inverted ? "text-[#e8d5b0]" : "text-[var(--brand-dark)]",
            )}
          >
            coachjdc.org
          </span>
          <span className="block truncate text-sm font-semibold tracking-[-0.01em]">
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
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={safeHref} className={className}>
      {content}
    </Link>
  );
}
