export const primaryDomain = "coachjdc.org";
export const eliteDomain = "elite.coachjdc.org";

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? `https://${primaryDomain}`
).replace(/\/$/, "");

export const eliteSiteUrl = (
  process.env.NEXT_PUBLIC_ELITE_SITE_URL ?? `https://${eliteDomain}`
).replace(/\/$/, "");

export function isEliteHost(host?: string | null) {
  const hostname = (host ?? "").split(":")[0]?.toLowerCase() ?? "";
  return hostname === eliteDomain || hostname.startsWith("elite.");
}
