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

export function mergeBrandingSettings(
  saved: Partial<BrandingSettings> | null,
  env = envBrandingSettings(),
): BrandingSettings {
  const logoHref = saved?.logoHref || env.logoHref || defaultBrandingSettings.logoHref;

  return {
    logoUrl: saved?.logoUrl || env.logoUrl || defaultBrandingSettings.logoUrl,
    logoHref: isSafeHref(logoHref) ? logoHref : defaultBrandingSettings.logoHref,
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
