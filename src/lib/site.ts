export const primaryDomain = "coachjdc.org";

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? `https://${primaryDomain}`
).replace(/\/$/, "");
