export const AFFILIATE_COOKIE = "jdc_aff";
export const AFFILIATE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function normalizeAffiliateCode(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32);
}

export function affiliateLinkPath(code: string, campaignSlug = "") {
  const safe = normalizeAffiliateCode(code);
  const campaign = normalizeAffiliateCode(campaignSlug);
  return campaign ? `/go/${safe}/${campaign}` : `/go/${safe}`;
}

export function maskAccountNumber(value: string) {
  const digits = value.replace(/\s+/g, "");
  if (digits.length < 4) {
    return "••••";
  }
  return `${"•".repeat(Math.max(4, digits.length - 4))}${digits.slice(-4)}`;
}

export function hasAffiliateWorkspace(user: { role: string; affiliateAccess: boolean }) {
  return user.role === "admin" || user.affiliateAccess;
}
