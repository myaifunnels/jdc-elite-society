export const AFFILIATE_COOKIE = "jdc_aff";
export const AFFILIATE_CAMPAIGN_COOKIE = "jdc_aff_campaign";
export const AFFILIATE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export const AFFILIATE_PROGRAM_IDS = ["pioneer", "jdc-partner"] as const;
export type AffiliateProgramId = (typeof AFFILIATE_PROGRAM_IDS)[number];

export type ProductCampaign = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  destinationPath: string;
  requiredProgram: AffiliateProgramId;
  commissionRate: number;
};

export const PRODUCT_CAMPAIGNS: ProductCampaign[] = [
  {
    slug: "foundation",
    title: "JDC Elite Society Portal + Life and Money Foundation Course",
    shortTitle: "Foundation Course",
    description:
      "First campaign for Pioneers. Promote the Elite Society Portal together with the Life and Money Foundation Course. Successful purchases earn 20%.",
    destinationPath: "/programs",
    requiredProgram: "pioneer",
    commissionRate: 0.2,
  },
  {
    slug: "mastermind",
    title: "JDC Elite Society Portal + JDC Mastermind Events (Session 1 and 2)",
    shortTitle: "Mastermind Events",
    description:
      "Coach-only campaign for contacts tagged jdc-partner. Additional 20% on successful purchases of the Elite Society Portal with Mastermind Sessions 1 and 2.",
    destinationPath: "/elite",
    requiredProgram: "jdc-partner",
    commissionRate: 0.2,
  },
];

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

export function normalizeAffiliateTag(value: string) {
  return value.trim().toLowerCase().replace(/[\s_]+/g, "-");
}

export function parseAffiliatePrograms(value: unknown): AffiliateProgramId[] {
  const raw = Array.isArray(value)
    ? value.map(String)
    : String(value ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  const next = new Set<AffiliateProgramId>();
  for (const item of raw) {
    const tag = normalizeAffiliateTag(item);
    if (tag === "pioneer") {
      next.add("pioneer");
    }
    if (tag === "jdc-partner" || tag === "jdcpartner") {
      next.add("jdc-partner");
    }
  }
  return AFFILIATE_PROGRAM_IDS.filter((id) => next.has(id));
}

export function serializeAffiliatePrograms(programs: AffiliateProgramId[]) {
  return parseAffiliatePrograms(programs).join(",");
}

export function hasAffiliateWorkspace(user: {
  role: string;
  affiliateAccess: boolean;
  affiliatePrograms?: AffiliateProgramId[];
}) {
  return user.role === "admin" || user.affiliateAccess || (user.affiliatePrograms?.length ?? 0) > 0;
}

export function canPromoteCampaign(
  programs: AffiliateProgramId[] | undefined,
  campaign: ProductCampaign,
  isAdmin = false,
) {
  return isAdmin || (programs ?? []).includes(campaign.requiredProgram);
}

export function campaignsForPrograms(programs: AffiliateProgramId[] | undefined, isAdmin = false) {
  return PRODUCT_CAMPAIGNS.filter((campaign) => canPromoteCampaign(programs, campaign, isAdmin));
}

export function getProductCampaign(slug: string) {
  const normalized = normalizeAffiliateCode(slug);
  return PRODUCT_CAMPAIGNS.find((campaign) => campaign.slug === normalized) ?? null;
}

export function defaultCampaignForPrograms(programs: AffiliateProgramId[] | undefined) {
  return campaignsForPrograms(programs)[0] ?? PRODUCT_CAMPAIGNS[0];
}

export function programLabel(id: AffiliateProgramId) {
  return id === "pioneer" ? "Pioneer" : "JDC Partner";
}
