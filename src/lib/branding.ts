export type BrandingSettings = {
  logoUrl: string;
  logoHref: string;
  logoAlt: string;
};

export const defaultBrandingSettings: BrandingSettings = {
  logoUrl: "",
  logoHref: "/",
  logoAlt: "Coach Jayson Dela Cruz",
};

/** The permanent, self-hosted JDC logo, used when the saved logo URL can't be trusted. */
export const FALLBACK_LOGO_URL =
  "https://vibe.filesafe.space/1780838141047994819/attachments/5738db11-cc5d-4ee5-91d6-b11707063731.png";

/** Facebook/Instagram CDN links are signed, expire after a while and refuse hotlinking (403), so a
 * logo saved from one silently breaks. */
export function isTemporarySocialUrl(value: string) {
  try {
    return /(^|\.)(fbcdn\.net|fbsbx\.com|cdninstagram\.com)$/i.test(new URL(value).hostname);
  } catch {
    return false;
  }
}

export function envBrandingSettings(): Partial<BrandingSettings> {
  return {
    logoUrl: process.env.NEXT_PUBLIC_SITE_LOGO_URL ?? "",
    logoHref: process.env.NEXT_PUBLIC_SITE_LOGO_HREF ?? "",
    logoAlt: process.env.NEXT_PUBLIC_SITE_LOGO_ALT ?? "",
  };
}

function looksLikeImageAsset(value: string) {
  const pathname = value.startsWith("/") ? value.split("?")[0] : (() => {
    try {
      return new URL(value).pathname;
    } catch {
      return value;
    }
  })();

  return /\.(avif|gif|ico|jpe?g|png|svg|webp)$/i.test(pathname);
}

export function resolveLogoHref(href: string | undefined, logoUrl = "") {
  const destination = href?.trim() || defaultBrandingSettings.logoHref;

  if (!isSafeHref(destination)) {
    return defaultBrandingSettings.logoHref;
  }

  if (logoUrl && destination === logoUrl) {
    return defaultBrandingSettings.logoHref;
  }

  if (looksLikeImageAsset(destination)) {
    return defaultBrandingSettings.logoHref;
  }

  return destination;
}

export function mergeBrandingSettings(
  saved: Partial<BrandingSettings> | null,
  env = envBrandingSettings(),
): BrandingSettings {
  const chosenLogoUrl = saved?.logoUrl || env.logoUrl || defaultBrandingSettings.logoUrl;
  const logoUrl = chosenLogoUrl && isTemporarySocialUrl(chosenLogoUrl) ? FALLBACK_LOGO_URL : chosenLogoUrl;
  const logoHref = resolveLogoHref(
    saved?.logoHref || env.logoHref || defaultBrandingSettings.logoHref,
    logoUrl,
  );

  return {
    logoUrl,
    logoHref,
    logoAlt: saved?.logoAlt || env.logoAlt || defaultBrandingSettings.logoAlt,
  };
}

export function isSafeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isSafeHref(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) {
    return true;
  }

  return isSafeHttpUrl(value);
}

export function isSafeAssetUrl(value: string) {
  if (!value) {
    return true;
  }

  if (value.startsWith("/") && !value.startsWith("//")) {
    return true;
  }

  return isSafeHttpUrl(value);
}
