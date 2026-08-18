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
  const logoUrl = saved?.logoUrl || env.logoUrl || defaultBrandingSettings.logoUrl;
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
