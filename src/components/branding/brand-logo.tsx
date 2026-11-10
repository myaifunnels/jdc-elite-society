"use client";

import { useState } from "react";

import { JdcWordmark } from "@/components/branding/jdc-wordmark";
import { BRAND_LOGO_BLUE_URL, BRAND_LOGO_WHITE_URL } from "@/lib/branding";
import { cn } from "@/lib/utils";

/**
 * The JDC mark in both colorways. The white version shows on dark themes, the blue version on light
 * ones (toggled in CSS by the `.dark` class on <html>, so there is no flash). `onDark` pins it to the
 * white version for surfaces that are always dark (hero overlays, the Elite landing pages).
 */
export function BrandLogo({
  alt = "Coach JDC",
  onDark = false,
  compact = false,
  className,
}: {
  alt?: string;
  onDark?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <JdcWordmark compact={compact} />;

  return (
    <span className={cn("brand-logo", onDark && "is-on-dark", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="brand-logo-white site-logo-image"
        src={BRAND_LOGO_WHITE_URL}
        alt={alt}
        width={188}
        height={82}
        onError={() => setFailed(true)}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="brand-logo-blue site-logo-image"
        src={BRAND_LOGO_BLUE_URL}
        alt=""
        aria-hidden="true"
        width={188}
        height={82}
        onError={() => setFailed(true)}
      />
    </span>
  );
}
