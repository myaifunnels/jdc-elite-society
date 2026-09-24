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
  /** Any affiliate (pioneer or jdc-partner) can promote it, not only `requiredProgram`. */
  open?: boolean;
};

const TIER_CAMPAIGNS: ProductCampaign[] = [
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
    destinationPath: "/building",
    requiredProgram: "jdc-partner",
    commissionRate: 0.2,
  },
];

/** The offers any affiliate can promote. Each gets its own tracked link, QR and campaign. */
const OFFER_CAMPAIGNS: ProductCampaign[] = [
  {
    slug: "jdc-elite-society",
    title: "JDC Elite Society",
    shortTitle: "JDC Elite Society",
    description: "Promote the JDC Elite Society portal and community. Successful purchases earn 20%.",
    destinationPath: "/programs/jdc-elite-society",
  },
  {
    slug: "season-1-building",
    title: "JDC Mastermind: Season 1 - Building",
    shortTitle: "JDC Mastermind: Season 1",
    description: "Promote JDC Mastermind Season 1, Building. Successful purchases earn 20%.",
    destinationPath: "/building",
  },
  {
    slug: "season-2-duplication",
    title: "JDC Mastermind: Duplication Season",
    shortTitle: "JDC Mastermind: Season 2",
    description: "Promote JDC Mastermind: Duplication Season. Successful purchases earn 20%.",
    destinationPath: "/duplication",
  },
].map((offer) => ({ ...offer, requiredProgram: "pioneer" as const, commissionRate: 0.2, open: true }));

export const PRODUCT_CAMPAIGNS: ProductCampaign[] = [...TIER_CAMPAIGNS, ...OFFER_CAMPAIGNS];

type CampaignRules = {
  commissionType?: "percent" | "fixed";
  level1Rate: number;
  level2Rate: number;
  level3Rate: number;
  cookieDays?: number;
};

function formatRate(rate: number, type: "percent" | "fixed") {
  return type === "fixed" ? `₱${rate.toLocaleString("en-PH", { maximumFractionDigits: 2 })}` : `${Math.round(rate * 10000) / 100}%`;
}

/** "20% direct · 5% level 2 · 30-day cookie", built from the campaign's own commission rules. */
export function campaignTerms(campaign: CampaignRules) {
  const type = campaign.commissionType ?? "percent";
  const parts = [`${formatRate(campaign.level1Rate, type)} direct`];
  if (campaign.level2Rate > 0) parts.push(`${formatRate(campaign.level2Rate, type)} level 2`);
  if (campaign.level3Rate > 0) parts.push(`${formatRate(campaign.level3Rate, type)} level 3`);
  if (campaign.cookieDays) parts.push(`${campaign.cookieDays}-day cookie`);
  return parts.join(" · ");
}

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
  if (isAdmin) return true;
  if (campaign.open) return (programs ?? []).length > 0;
  return (programs ?? []).includes(campaign.requiredProgram);
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
