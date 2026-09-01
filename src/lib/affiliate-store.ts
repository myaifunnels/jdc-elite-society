import { Pool } from "pg";

import {
  affiliateLinkPath,
  canPromoteCampaign,
  defaultCampaignForPrograms,
  getProductCampaign,
  normalizeAffiliateCode,
  parseAffiliatePrograms,
  PRODUCT_CAMPAIGNS,
  serializeAffiliatePrograms,
  type AffiliateProgramId,
} from "@/lib/affiliate";
import {
  cycleForPayDate,
  cycleForYmd,
  DEFAULT_COMMISSION_RATE,
  followingPayDate,
  manilaYmd,
  nextPayDate,
} from "@/lib/pay-cycle";
import { siteUrl } from "@/lib/site";
import {
  AffiliateAttribution,
  AffiliateCampaign,
  AffiliateClick,
  AffiliateMaterial,
  AffiliatePayout,
  AffiliatePayoutMethod,
  AffiliatePayoutStatus,
  AffiliateProfile,
  AffiliateSale,
  AffiliateSaleStatus,
  AffiliateStatus,
  AffiliateTreeNode,
  AuthUser,
  PayoutMethodKind,
} from "@/lib/types";

const memory = {
  profiles: [] as AffiliateProfile[],
  methods: [] as AffiliatePayoutMethod[],
  sales: [] as AffiliateSale[],
  payouts: [] as AffiliatePayout[],
  campaigns: [] as AffiliateCampaign[],
  materials: [] as AffiliateMaterial[],
  clicks: [] as AffiliateClick[],
  attributions: [] as AffiliateAttribution[],
};

let pool: Pool | null | undefined;
let tableReady = false;
let seeded = false;
let partnershipsBackfilled = false;

function getPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return null;
  }

  if (pool === undefined) {
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false },
    });
  }

  return pool;
}

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asBool(value: unknown) {
  return value === true || value === "t" || value === "true" || value === 1 || value === "1";
}

function mapProfile(row: Record<string, unknown>): AffiliateProfile {
  return {
    userId: String(row.user_id ?? ""),
    code: String(row.code ?? ""),
    sponsorId: String(row.sponsor_id ?? ""),
    status: row.status === "paused" || row.status === "invited" ? row.status : "active",
    commissionRate: asNumber(row.commission_rate, DEFAULT_COMMISSION_RATE),
    programs: parseAffiliatePrograms(row.programs),
    activatedAt: String(row.activated_at ?? new Date().toISOString()),
  };
}

function mapMethod(row: Record<string, unknown>): AffiliatePayoutMethod {
  const method = String(row.method ?? "bank");
  return {
    userId: String(row.user_id ?? ""),
    method: method === "gcash" || method === "maya" || method === "other" ? method : "bank",
    bankName: String(row.bank_name ?? ""),
    accountName: String(row.account_name ?? ""),
    accountNumber: String(row.account_number ?? ""),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

function mapSale(row: Record<string, unknown>): AffiliateSale {
  const status = String(row.status ?? "approved");
  return {
    id: String(row.id ?? ""),
    affiliateUserId: String(row.affiliate_user_id ?? ""),
    grossAmount: asNumber(row.gross_amount),
    commissionAmount: asNumber(row.commission_amount),
    source: String(row.source ?? ""),
    campaignSlug: String(row.campaign_slug ?? ""),
    status: status === "pending" || status === "void" ? status : "approved",
    soldAt: String(row.sold_at ?? ""),
    periodStart: String(row.period_start ?? ""),
    periodEnd: String(row.period_end ?? ""),
    scheduledPayDate: String(row.scheduled_pay_date ?? ""),
    payoutId: String(row.payout_id ?? ""),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapPayout(row: Record<string, unknown>): AffiliatePayout {
  const status = String(row.status ?? "pending");
  return {
    id: String(row.id ?? ""),
    affiliateUserId: String(row.affiliate_user_id ?? ""),
    amount: asNumber(row.amount),
    status: status === "approved" || status === "paid" ? status : "pending",
    periodStart: String(row.period_start ?? ""),
    periodEnd: String(row.period_end ?? ""),
    scheduledPayDate: String(row.scheduled_pay_date ?? ""),
    paidAt: String(row.paid_at ?? ""),
    reference: String(row.reference ?? ""),
    note: String(row.note ?? ""),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapCampaign(row: Record<string, unknown>): AffiliateCampaign {
  return {
    id: String(row.id ?? ""),
    slug: String(row.slug ?? ""),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    destinationPath: String(row.destination_path ?? "/register"),
    requiredProgram: parseAffiliatePrograms(row.required_program)[0] ?? "",
    active: asBool(row.active ?? true),
  };
}

function mapMaterial(row: Record<string, unknown>): AffiliateMaterial {
  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    category: String(row.category ?? ""),
    fileUrl: String(row.file_url ?? ""),
    fileName: String(row.file_name ?? ""),
    sortOrder: asNumber(row.sort_order),
    active: asBool(row.active ?? true),
  };
}

function mapClick(row: Record<string, unknown>): AffiliateClick {
  return {
    id: String(row.id ?? ""),
    code: String(row.code ?? ""),
    campaignSlug: String(row.campaign_slug ?? ""),
    path: String(row.path ?? ""),
    userAgent: String(row.user_agent ?? ""),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapAttribution(row: Record<string, unknown>): AffiliateAttribution {
  return {
    id: String(row.id ?? ""),
    kind: String(row.kind ?? "") === "registration" ? "registration" : "inquiry",
    code: String(row.code ?? ""),
    campaignSlug: String(row.campaign_slug ?? ""),
    email: String(row.email ?? ""),
    name: String(row.name ?? ""),
    userId: String(row.user_id ?? ""),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

async function ensureTable(client: Pool) {
  if (tableReady) {
    return;
  }

  await client.query(`
    CREATE TABLE IF NOT EXISTS affiliate_profiles (
      user_id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      sponsor_id TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      commission_rate NUMERIC NOT NULL DEFAULT 0.20,
      activated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await client.query(`
    ALTER TABLE affiliate_profiles
    ADD COLUMN IF NOT EXISTS programs TEXT NOT NULL DEFAULT ''
  `);
  await client.query(`
    UPDATE affiliate_profiles SET status = 'active' WHERE status = 'invited'
  `);
  await client.query(`
    UPDATE affiliate_sales SET status = 'approved' WHERE status = 'pending'
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS affiliate_payout_methods (
      user_id TEXT PRIMARY KEY,
      method TEXT NOT NULL,
      bank_name TEXT NOT NULL DEFAULT '',
      account_name TEXT NOT NULL DEFAULT '',
      account_number TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS affiliate_sales (
      id TEXT PRIMARY KEY,
      affiliate_user_id TEXT NOT NULL,
      gross_amount NUMERIC NOT NULL,
      commission_amount NUMERIC NOT NULL,
      source TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'approved',
      sold_at DATE NOT NULL,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      scheduled_pay_date DATE NOT NULL,
      payout_id TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await client.query(`
    ALTER TABLE affiliate_sales
    ADD COLUMN IF NOT EXISTS campaign_slug TEXT NOT NULL DEFAULT ''
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS affiliate_payouts (
      id TEXT PRIMARY KEY,
      affiliate_user_id TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      scheduled_pay_date DATE NOT NULL,
      paid_at TIMESTAMPTZ,
      reference TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS affiliate_campaigns (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      destination_path TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE
    )
  `);
  await client.query(`
    ALTER TABLE affiliate_campaigns
    ADD COLUMN IF NOT EXISTS required_program TEXT NOT NULL DEFAULT ''
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS affiliate_materials (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      file_url TEXT NOT NULL,
      file_name TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE
    )
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS affiliate_clicks (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      campaign_slug TEXT NOT NULL DEFAULT '',
      path TEXT NOT NULL DEFAULT '',
      user_agent TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS affiliate_attributions (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      code TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL DEFAULT '',
      user_id TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await client.query(`
    ALTER TABLE affiliate_attributions
    ADD COLUMN IF NOT EXISTS campaign_slug TEXT NOT NULL DEFAULT ''
  `);
  tableReady = true;
}

const defaultCampaigns: AffiliateCampaign[] = PRODUCT_CAMPAIGNS.map((campaign) => ({
  id: `camp-${campaign.slug}`,
  slug: campaign.slug,
  title: campaign.title,
  description: campaign.description,
  destinationPath: campaign.destinationPath,
  requiredProgram: campaign.requiredProgram,
  active: true,
}));

async function ensureSeed() {
  if (seeded) {
    return;
  }
  seeded = true;

  const client = getPool();
  memory.campaigns = defaultCampaigns.map((item) => ({ ...item }));

  if (client) {
    try {
      await ensureTable(client);
      for (const campaign of defaultCampaigns) {
        await client.query(
          `
          INSERT INTO affiliate_campaigns (id, slug, title, description, destination_path, active, required_program)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (slug) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            destination_path = EXCLUDED.destination_path,
            required_program = EXCLUDED.required_program,
            active = TRUE
          `,
          [
            campaign.id,
            campaign.slug,
            campaign.title,
            campaign.description,
            campaign.destinationPath,
            campaign.active,
            campaign.requiredProgram,
          ],
        );
      }
    } catch (error) {
      console.error("Failed to seed affiliate campaigns", error);
    }
  }

  await backfillApprovedPartnerships();
}

async function backfillApprovedPartnerships() {
  if (partnershipsBackfilled) {
    return;
  }
  partnershipsBackfilled = true;
  try {
    await approveAllPartnerships({ includePausedWithPrograms: false, includeContactTags: false });
  } catch (error) {
    partnershipsBackfilled = false;
    console.error("Failed to backfill approved partnerships", error);
  }
}

async function withStore<T>(reader: (client: Pool) => Promise<T>, fallback: () => T): Promise<T> {
  await ensureSeed();
  const client = getPool();
  if (!client) {
    return fallback();
  }
  try {
    await ensureTable(client);
    return await reader(client);
  } catch (error) {
    console.error("Affiliate store error", error);
    return fallback();
  }
}

function uniqueCodeFromName(name: string, existing: Set<string>) {
  const base = normalizeAffiliateCode(name.replace(/[^a-zA-Z0-9]+/g, "")).slice(0, 10) || "partner";
  let candidate = `${base}${Math.random().toString(36).slice(2, 6)}`;
  while (existing.has(candidate)) {
    candidate = `${base}${Math.random().toString(36).slice(2, 6)}`;
  }
  return candidate;
}

export async function listProfiles(): Promise<AffiliateProfile[]> {
  return withStore(
    async (client) => {
      const result = await client.query("SELECT * FROM affiliate_profiles ORDER BY activated_at DESC");
      return result.rows.map(mapProfile);
    },
    () => [...memory.profiles],
  );
}

export async function getProfile(userId: string) {
  const profiles = await listProfiles();
  return profiles.find((item) => item.userId === userId) ?? null;
}

export async function getProfileByCode(code: string) {
  const normalized = normalizeAffiliateCode(code);
  const profiles = await listProfiles();
  return profiles.find((item) => item.code === normalized) ?? null;
}

export async function upsertProfile(input: {
  userId: string;
  sponsorId?: string;
  status?: AffiliateStatus;
  commissionRate?: number;
  programs?: AffiliateProgramId[];
  regenerateCode?: boolean;
}) {
  const existing = await getProfile(input.userId);
  const all = await listProfiles();
  const codes = new Set(all.map((item) => item.code));
  if (existing) {
    codes.delete(existing.code);
  }

  const { getPublicUserById } = await import("@/lib/auth-store");
  const user = await getPublicUserById(input.userId);
  const next: AffiliateProfile = {
    userId: input.userId,
    code: input.regenerateCode || !existing ? uniqueCodeFromName(user?.name ?? "partner", codes) : existing.code,
    sponsorId: input.sponsorId ?? existing?.sponsorId ?? "",
    status: input.status ?? existing?.status ?? "active",
    commissionRate: input.commissionRate ?? existing?.commissionRate ?? DEFAULT_COMMISSION_RATE,
    programs: parseAffiliatePrograms(input.programs ?? existing?.programs ?? user?.affiliatePrograms),
    activatedAt: existing?.activatedAt ?? new Date().toISOString(),
  };

  const index = memory.profiles.findIndex((item) => item.userId === next.userId);
  if (index >= 0) {
    memory.profiles[index] = next;
  } else {
    memory.profiles.unshift(next);
  }

  await withStore(
    async (client) => {
      await client.query(
        `
        INSERT INTO affiliate_profiles (user_id, code, sponsor_id, status, commission_rate, activated_at, programs)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id) DO UPDATE SET
          code = EXCLUDED.code,
          sponsor_id = EXCLUDED.sponsor_id,
          status = EXCLUDED.status,
          commission_rate = EXCLUDED.commission_rate,
          programs = EXCLUDED.programs
        `,
        [
          next.userId,
          next.code,
          next.sponsorId,
          next.status,
          next.commissionRate,
          next.activatedAt,
          serializeAffiliatePrograms(next.programs),
        ],
      );
      return next;
    },
    () => next,
  );

  return next;
}

export async function removeProfileForUser(userId: string) {
  memory.profiles = memory.profiles.filter((item) => item.userId !== userId);
  await withStore(
    async (client) => {
      await client.query("DELETE FROM affiliate_profiles WHERE user_id = $1", [userId]);
      return true;
    },
    () => true,
  );
}

export async function wouldCreateSponsorCycle(userId: string, sponsorId: string) {
  if (!sponsorId || sponsorId === userId) {
    return sponsorId === userId;
  }

  const profiles = await listProfiles();
  const byId = new Map(profiles.map((item) => [item.userId, item]));
  let cursor = sponsorId;
  const seen = new Set<string>([userId]);

  while (cursor) {
    if (seen.has(cursor)) {
      return true;
    }
    seen.add(cursor);
    cursor = byId.get(cursor)?.sponsorId ?? "";
  }

  return false;
}

export async function getPayoutMethod(userId: string) {
  return withStore(
    async (client) => {
      const result = await client.query(
        "SELECT * FROM affiliate_payout_methods WHERE user_id = $1 LIMIT 1",
        [userId],
      );
      return result.rows[0] ? mapMethod(result.rows[0]) : null;
    },
    () => memory.methods.find((item) => item.userId === userId) ?? null,
  );
}

export async function savePayoutMethod(input: {
  userId: string;
  method: PayoutMethodKind;
  bankName: string;
  accountName: string;
  accountNumber: string;
}) {
  const next: AffiliatePayoutMethod = {
    ...input,
    updatedAt: new Date().toISOString(),
  };
  const index = memory.methods.findIndex((item) => item.userId === input.userId);
  if (index >= 0) {
    memory.methods[index] = next;
  } else {
    memory.methods.unshift(next);
  }

  await withStore(
    async (client) => {
      await client.query(
        `
        INSERT INTO affiliate_payout_methods (user_id, method, bank_name, account_name, account_number, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id) DO UPDATE SET
          method = EXCLUDED.method,
          bank_name = EXCLUDED.bank_name,
          account_name = EXCLUDED.account_name,
          account_number = EXCLUDED.account_number,
          updated_at = EXCLUDED.updated_at
        `,
        [next.userId, next.method, next.bankName, next.accountName, next.accountNumber, next.updatedAt],
      );
      return next;
    },
    () => next,
  );

  return next;
}

export async function listSales(affiliateUserId?: string) {
  return withStore(
    async (client) => {
      const result = affiliateUserId
        ? await client.query(
            "SELECT * FROM affiliate_sales WHERE affiliate_user_id = $1 ORDER BY sold_at DESC, created_at DESC",
            [affiliateUserId],
          )
        : await client.query("SELECT * FROM affiliate_sales ORDER BY sold_at DESC, created_at DESC");
      return result.rows.map(mapSale);
    },
    () =>
      memory.sales
        .filter((item) => !affiliateUserId || item.affiliateUserId === affiliateUserId)
        .slice()
        .sort((a, b) => b.soldAt.localeCompare(a.soldAt)),
  );
}

export async function recordSale(input: {
  affiliateUserId: string;
  grossAmount: number;
  source: string;
  campaignSlug: string;
  soldAt?: string;
  status?: AffiliateSaleStatus;
}) {
  const profile = await getProfile(input.affiliateUserId);
  const campaign = getProductCampaign(input.campaignSlug);
  if (!campaign) {
    throw new Error("Choose Foundation Course or Mastermind Events.");
  }
  if (!canPromoteCampaign(profile?.programs, campaign)) {
    throw new Error(
      campaign.requiredProgram === "pioneer"
        ? "That promoter needs the pioneer tag for the Foundation Course campaign."
        : "That promoter needs the jdc-partner tag for the Mastermind campaign.",
    );
  }
  const rate = campaign.commissionRate;
  const soldAt = input.soldAt || manilaYmd();
  const cycle = cycleForYmd(soldAt);
  const sale: AffiliateSale = {
    id: newId("sale"),
    affiliateUserId: input.affiliateUserId,
    grossAmount: input.grossAmount,
    commissionAmount: Math.round(input.grossAmount * rate * 100) / 100,
    source: input.source.trim() || campaign.title,
    campaignSlug: campaign.slug,
    status: input.status ?? "approved",
    soldAt,
    periodStart: cycle.periodStart,
    periodEnd: cycle.periodEnd,
    scheduledPayDate: cycle.scheduledPayDate,
    payoutId: "",
    createdAt: new Date().toISOString(),
  };

  memory.sales.unshift(sale);
  await withStore(
    async (client) => {
      await client.query(
        `
        INSERT INTO affiliate_sales (
          id, affiliate_user_id, gross_amount, commission_amount, source, status,
          sold_at, period_start, period_end, scheduled_pay_date, payout_id, created_at, campaign_slug
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        `,
        [
          sale.id,
          sale.affiliateUserId,
          sale.grossAmount,
          sale.commissionAmount,
          sale.source,
          sale.status,
          sale.soldAt,
          sale.periodStart,
          sale.periodEnd,
          sale.scheduledPayDate,
          sale.payoutId,
          sale.createdAt,
          sale.campaignSlug,
        ],
      );
      return sale;
    },
    () => sale,
  );

  return sale;
}

export async function voidSale(id: string) {
  const sales = await listSales();
  const sale = sales.find((item) => item.id === id);
  if (!sale || sale.payoutId) {
    return sale ?? null;
  }
  sale.status = "void";
  const index = memory.sales.findIndex((item) => item.id === id);
  if (index >= 0) {
    memory.sales[index] = sale;
  }
  await withStore(
    async (client) => {
      await client.query("UPDATE affiliate_sales SET status = 'void' WHERE id = $1 AND payout_id = ''", [id]);
      return sale;
    },
    () => sale,
  );
  return sale;
}

export type PartnershipApprovalOptions = {
  includePausedWithPrograms?: boolean;
  includeContactTags?: boolean;
};

export type PartnershipApprovalSummary = {
  partnersActivated: number;
  partnersCreated: number;
  salesApproved: number;
};

function isRevokedPartner(profile: AffiliateProfile | undefined, programs: AffiliateProgramId[]) {
  return Boolean(profile && profile.status === "paused" && profile.programs.length === 0 && programs.length === 0);
}

async function contactProgramsByEmail() {
  const { listContacts } = await import("@/lib/crm-store");
  const contacts = await listContacts({
    role: "admin",
    name: "Partnership admin",
    email: "",
    seeAllContacts: true,
  });
  const byEmail = new Map<string, AffiliateProgramId[]>();
  for (const contact of contacts) {
    const programs = parseAffiliatePrograms(contact.tags);
    if (programs.length === 0) {
      continue;
    }
    byEmail.set(contact.email.trim().toLowerCase(), programs);
  }
  return byEmail;
}

export async function approvePendingSales() {
  const sales = await listSales();
  let salesApproved = 0;
  for (const sale of sales) {
    if (sale.status !== "pending") {
      continue;
    }
    sale.status = "approved";
    const index = memory.sales.findIndex((item) => item.id === sale.id);
    if (index >= 0) {
      memory.sales[index] = sale;
    }
    salesApproved += 1;
  }

  await withStore(
    async (client) => {
      await client.query("UPDATE affiliate_sales SET status = 'approved' WHERE status = 'pending'");
      return salesApproved;
    },
    () => salesApproved,
  );

  return salesApproved;
}

export async function approveAllPartnerships(
  options: PartnershipApprovalOptions = {},
): Promise<PartnershipApprovalSummary> {
  const includePausedWithPrograms = options.includePausedWithPrograms ?? true;
  const includeContactTags = options.includeContactTags ?? true;

  let invitedActivated = 0;
  for (const profile of memory.profiles) {
    if (profile.status !== "invited") {
      continue;
    }
    profile.status = "active";
    if (profile.programs.length === 0) {
      profile.programs = ["pioneer"];
    }
    invitedActivated += 1;
  }
  invitedActivated = await withStore(
    async (client) => {
      const result = await client.query(
        `
        UPDATE affiliate_profiles
        SET status = 'active',
            programs = CASE WHEN TRIM(programs) = '' THEN 'pioneer' ELSE programs END
        WHERE status = 'invited'
        RETURNING user_id
        `,
      );
      return result.rowCount ?? 0;
    },
    () => invitedActivated,
  );

  const { listPublicUsers, setAffiliatePrograms } = await import("@/lib/auth-store");
  const users = await listPublicUsers();
  const profiles = await listProfiles();
  const profileByUser = new Map(profiles.map((item) => [item.userId, item]));
  let taggedByEmail = new Map<string, AffiliateProgramId[]>();

  if (includeContactTags) {
    try {
      taggedByEmail = await contactProgramsByEmail();
    } catch (error) {
      console.error("Could not load contact tags for partnership approval", error);
    }
  }

  let partnersActivated = invitedActivated;
  let partnersCreated = 0;
  const seen = new Set<string>();

  for (const user of users) {
    seen.add(user.id);
    const profile = profileByUser.get(user.id);
    const fromContact = taggedByEmail.get(user.email.trim().toLowerCase()) ?? [];
    const programs = parseAffiliatePrograms([
      ...(profile?.programs ?? []),
      ...(user.affiliatePrograms ?? []),
      ...fromContact,
    ]);

    if (isRevokedPartner(profile, programs)) {
      continue;
    }
    if (profile?.status === "paused" && profile.programs.length > 0 && !includePausedWithPrograms && fromContact.length === 0) {
      continue;
    }

    const hasPartnership =
      Boolean(profile) || user.affiliateAccess || programs.length > 0 || user.role === "partner";
    if (!hasPartnership) {
      continue;
    }
    if (!profile && user.role === "admin" && programs.length === 0 && !user.affiliateAccess) {
      continue;
    }

    const nextPrograms = programs.length > 0 ? programs : (["pioneer"] as AffiliateProgramId[]);
    const needsProfile = !profile;
    const needsActivation = profile?.status !== "active";
    const needsPrograms =
      serializeAffiliatePrograms(profile?.programs ?? []) !== serializeAffiliatePrograms(nextPrograms);
    const needsAccess = !user.affiliateAccess || serializeAffiliatePrograms(user.affiliatePrograms) !== serializeAffiliatePrograms(nextPrograms);

    if (!needsProfile && !needsActivation && !needsPrograms && !needsAccess) {
      continue;
    }

    await setAffiliatePrograms(user.id, nextPrograms);
    await upsertProfile({
      userId: user.id,
      programs: nextPrograms,
      status: "active",
    });
    if (needsProfile) {
      partnersCreated += 1;
    } else if (needsActivation) {
      partnersActivated += 1;
    }
  }

  for (const profile of profiles) {
    if (seen.has(profile.userId)) {
      continue;
    }
    if (isRevokedPartner(profile, profile.programs)) {
      continue;
    }
    if (profile.status === "paused" && profile.programs.length > 0 && !includePausedWithPrograms) {
      continue;
    }
    const nextPrograms = profile.programs.length > 0 ? profile.programs : (["pioneer"] as AffiliateProgramId[]);
    if (profile.status === "active" && serializeAffiliatePrograms(profile.programs) === serializeAffiliatePrograms(nextPrograms)) {
      continue;
    }
    await upsertProfile({
      userId: profile.userId,
      programs: nextPrograms,
      status: "active",
    });
    partnersActivated += 1;
  }

  const salesApproved = await approvePendingSales();
  return { partnersActivated, partnersCreated, salesApproved };
}

export async function listPayouts(affiliateUserId?: string) {
  return withStore(
    async (client) => {
      const result = affiliateUserId
        ? await client.query(
            "SELECT * FROM affiliate_payouts WHERE affiliate_user_id = $1 ORDER BY scheduled_pay_date DESC, created_at DESC",
            [affiliateUserId],
          )
        : await client.query("SELECT * FROM affiliate_payouts ORDER BY scheduled_pay_date DESC, created_at DESC");
      return result.rows.map(mapPayout);
    },
    () =>
      memory.payouts
        .filter((item) => !affiliateUserId || item.affiliateUserId === affiliateUserId)
        .slice()
        .sort((a, b) => b.scheduledPayDate.localeCompare(a.scheduledPayDate)),
  );
}

export async function unpaidApprovedSales(affiliateUserId?: string) {
  const sales = await listSales(affiliateUserId);
  return sales.filter((item) => item.status === "approved" && !item.payoutId);
}

export async function markCyclePaid(input: {
  affiliateUserId: string;
  scheduledPayDate: string;
  reference: string;
  note?: string;
}) {
  const unpaid = (await unpaidApprovedSales(input.affiliateUserId)).filter(
    (item) => item.scheduledPayDate === input.scheduledPayDate,
  );

  if (unpaid.length === 0) {
    return null;
  }

  const cycle = cycleForPayDate(input.scheduledPayDate);
  const amount = Math.round(unpaid.reduce((sum, item) => sum + item.commissionAmount, 0) * 100) / 100;
  const payout: AffiliatePayout = {
    id: newId("payout"),
    affiliateUserId: input.affiliateUserId,
    amount,
    status: "paid",
    periodStart: cycle.periodStart,
    periodEnd: cycle.periodEnd,
    scheduledPayDate: input.scheduledPayDate,
    paidAt: new Date().toISOString(),
    reference: input.reference.trim(),
    note: input.note?.trim() ?? "",
    createdAt: new Date().toISOString(),
  };

  memory.payouts.unshift(payout);
  for (const sale of unpaid) {
    sale.payoutId = payout.id;
    const index = memory.sales.findIndex((item) => item.id === sale.id);
    if (index >= 0) {
      memory.sales[index] = sale;
    }
  }

  await withStore(
    async (client) => {
      await client.query(
        `
        INSERT INTO affiliate_payouts (
          id, affiliate_user_id, amount, status, period_start, period_end,
          scheduled_pay_date, paid_at, reference, note, created_at
        )
        VALUES ($1,$2,$3,'paid',$4,$5,$6,$7,$8,$9,$10)
        `,
        [
          payout.id,
          payout.affiliateUserId,
          payout.amount,
          payout.periodStart,
          payout.periodEnd,
          payout.scheduledPayDate,
          payout.paidAt,
          payout.reference,
          payout.note,
          payout.createdAt,
        ],
      );
      await client.query(
        `UPDATE affiliate_sales SET payout_id = $1 WHERE id = ANY($2::text[])`,
        [payout.id, unpaid.map((item) => item.id)],
      );
      return payout;
    },
    () => payout,
  );

  return payout;
}

export async function listCampaigns(activeOnly = true) {
  const campaigns = await withStore(
    async (client) => {
      const result = await client.query("SELECT * FROM affiliate_campaigns ORDER BY title ASC");
      return result.rows.map(mapCampaign);
    },
    () => [...memory.campaigns],
  );
  return activeOnly ? campaigns.filter((item) => item.active) : campaigns;
}

export async function getCampaignBySlug(slug: string) {
  const campaigns = await listCampaigns(false);
  return campaigns.find((item) => item.slug === normalizeAffiliateCode(slug)) ?? null;
}

export async function upsertCampaign(input: {
  id?: string;
  slug: string;
  title: string;
  description: string;
  destinationPath: string;
  active?: boolean;
}) {
  const slug = normalizeAffiliateCode(input.slug);
  const existing = await getCampaignBySlug(slug);
  const next: AffiliateCampaign = {
    id: input.id || existing?.id || newId("camp"),
    slug,
    title: input.title.trim(),
    description: input.description.trim(),
    destinationPath: input.destinationPath.trim() || "/register",
    requiredProgram: existing?.requiredProgram ?? "",
    active: input.active ?? existing?.active ?? true,
  };

  const index = memory.campaigns.findIndex((item) => item.id === next.id || item.slug === next.slug);
  if (index >= 0) {
    memory.campaigns[index] = next;
  } else {
    memory.campaigns.unshift(next);
  }

  await withStore(
    async (client) => {
      await client.query(
        `
        INSERT INTO affiliate_campaigns (id, slug, title, description, destination_path, active)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          destination_path = EXCLUDED.destination_path,
          active = EXCLUDED.active
        `,
        [next.id, next.slug, next.title, next.description, next.destinationPath, next.active],
      );
      return next;
    },
    () => next,
  );

  return next;
}

export async function listMaterials(activeOnly = true) {
  const materials = await withStore(
    async (client) => {
      const result = await client.query("SELECT * FROM affiliate_materials ORDER BY sort_order ASC, title ASC");
      return result.rows.map(mapMaterial);
    },
    () => [...memory.materials].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)),
  );
  return activeOnly ? materials.filter((item) => item.active) : materials;
}

export async function upsertMaterial(input: {
  id?: string;
  title: string;
  category: string;
  fileUrl: string;
  fileName: string;
  sortOrder?: number;
  active?: boolean;
}) {
  const next: AffiliateMaterial = {
    id: input.id || newId("mat"),
    title: input.title.trim(),
    category: input.category.trim() || "General",
    fileUrl: input.fileUrl.trim(),
    fileName: input.fileName.trim(),
    sortOrder: input.sortOrder ?? 0,
    active: input.active ?? true,
  };
  const index = memory.materials.findIndex((item) => item.id === next.id);
  if (index >= 0) {
    memory.materials[index] = next;
  } else {
    memory.materials.unshift(next);
  }

  await withStore(
    async (client) => {
      await client.query(
        `
        INSERT INTO affiliate_materials (id, title, category, file_url, file_name, sort_order, active)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          file_url = EXCLUDED.file_url,
          file_name = EXCLUDED.file_name,
          sort_order = EXCLUDED.sort_order,
          active = EXCLUDED.active
        `,
        [next.id, next.title, next.category, next.fileUrl, next.fileName, next.sortOrder, next.active],
      );
      return next;
    },
    () => next,
  );

  return next;
}

export async function recordClick(input: { code: string; campaignSlug: string; path: string; userAgent: string }) {
  const click: AffiliateClick = {
    id: newId("click"),
    code: normalizeAffiliateCode(input.code),
    campaignSlug: normalizeAffiliateCode(input.campaignSlug),
    path: input.path.slice(0, 180),
    userAgent: input.userAgent.slice(0, 180),
    createdAt: new Date().toISOString(),
  };
  memory.clicks.unshift(click);
  if (memory.clicks.length > 2000) {
    memory.clicks.length = 2000;
  }

  await withStore(
    async (client) => {
      await client.query(
        `
        INSERT INTO affiliate_clicks (id, code, campaign_slug, path, user_agent, created_at)
        VALUES ($1,$2,$3,$4,$5,$6)
        `,
        [click.id, click.code, click.campaignSlug, click.path, click.userAgent, click.createdAt],
      );
      return click;
    },
    () => click,
  );

  return click;
}

export async function listClicks(code?: string) {
  return withStore(
    async (client) => {
      const result = code
        ? await client.query(
            "SELECT * FROM affiliate_clicks WHERE code = $1 ORDER BY created_at DESC LIMIT 500",
            [normalizeAffiliateCode(code)],
          )
        : await client.query("SELECT * FROM affiliate_clicks ORDER BY created_at DESC LIMIT 500");
      return result.rows.map(mapClick);
    },
    () =>
      memory.clicks
        .filter((item) => !code || item.code === normalizeAffiliateCode(code))
        .slice(0, 500),
  );
}

export async function recordAttribution(input: {
  kind: "inquiry" | "registration";
  code: string;
  email: string;
  name: string;
  userId?: string;
  campaignSlug?: string;
}) {
  const attribution: AffiliateAttribution = {
    id: newId("attr"),
    kind: input.kind,
    code: normalizeAffiliateCode(input.code),
    campaignSlug: normalizeAffiliateCode(input.campaignSlug ?? ""),
    email: input.email.trim().toLowerCase(),
    name: input.name.trim(),
    userId: input.userId ?? "",
    createdAt: new Date().toISOString(),
  };
  memory.attributions.unshift(attribution);

  await withStore(
    async (client) => {
      await client.query(
        `
        INSERT INTO affiliate_attributions (id, kind, code, email, name, user_id, created_at, campaign_slug)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        `,
        [
          attribution.id,
          attribution.kind,
          attribution.code,
          attribution.email,
          attribution.name,
          attribution.userId,
          attribution.createdAt,
          attribution.campaignSlug,
        ],
      );
      return attribution;
    },
    () => attribution,
  );

  return attribution;
}

export async function listAttributions(code?: string) {
  return withStore(
    async (client) => {
      const result = code
        ? await client.query(
            "SELECT * FROM affiliate_attributions WHERE code = $1 ORDER BY created_at DESC LIMIT 200",
            [normalizeAffiliateCode(code)],
          )
        : await client.query("SELECT * FROM affiliate_attributions ORDER BY created_at DESC LIMIT 200");
      return result.rows.map(mapAttribution);
    },
    () => memory.attributions.filter((item) => !code || item.code === normalizeAffiliateCode(code)).slice(0, 200),
  );
}

export async function resolveGoDestination(code: string, campaignSlug = "") {
  const profile = await getProfileByCode(code);
  if (!profile || profile.status === "paused") {
    return { profile, destination: "/register", campaign: null as ReturnType<typeof getProductCampaign> };
  }

  const requested = getProductCampaign(campaignSlug);
  const campaign =
    requested && canPromoteCampaign(profile.programs, requested)
      ? requested
      : defaultCampaignForPrograms(profile.programs);

  return { profile, destination: campaign.destinationPath, campaign };
}

export function brandedUrl(code: string, campaignSlug = "") {
  return `${siteUrl}${affiliateLinkPath(code, campaignSlug)}`;
}

export async function buildTree(
  rootUserId: string,
  usersById: Map<string, AuthUser>,
  depth = 5,
): Promise<AffiliateTreeNode | null> {
  const profiles = await listProfiles();
  const profile = profiles.find((item) => item.userId === rootUserId);
  const user = usersById.get(rootUserId);
  if (!profile || !user) {
    return null;
  }

  const childrenOf = new Map<string, AffiliateProfile[]>();
  for (const item of profiles) {
    if (!item.sponsorId) {
      continue;
    }
    const list = childrenOf.get(item.sponsorId) ?? [];
    list.push(item);
    childrenOf.set(item.sponsorId, list);
  }

  function nodeFor(item: AffiliateProfile, remaining: number, trail: Set<string>): AffiliateTreeNode | null {
    const person = usersById.get(item.userId);
    if (!person) {
      return null;
    }
    const children: AffiliateTreeNode[] = [];
    if (remaining > 0 && !trail.has(item.userId)) {
      const nextTrail = new Set(trail);
      nextTrail.add(item.userId);
      for (const child of childrenOf.get(item.userId) ?? []) {
        const built = nodeFor(child, remaining - 1, nextTrail);
        if (built) {
          children.push(built);
        }
      }
    }
    return {
      userId: item.userId,
      name: person.name,
      email: person.email,
      code: item.code,
      status: item.status,
      activatedAt: item.activatedAt,
      children,
    };
  }

  return nodeFor(profile, depth, new Set());
}

export async function affiliateDashboardStats(userId: string) {
  const profile = await getProfile(userId);
  const sales = await listSales(userId);
  const payouts = await listPayouts(userId);
  const clicks = profile ? await listClicks(profile.code) : [];
  const attributions = profile ? await listAttributions(profile.code) : [];
  const payday = nextPayDate();
  const following = followingPayDate();
  const now = Date.now();
  const day = 86400000;

  const approvedUnpaid = sales.filter((item) => item.status === "approved" && !item.payoutId);
  const thisCycle = approvedUnpaid
    .filter((item) => item.scheduledPayDate === payday)
    .reduce((sum, item) => sum + item.commissionAmount, 0);
  const nextCycle = approvedUnpaid
    .filter((item) => item.scheduledPayDate === following)
    .reduce((sum, item) => sum + item.commissionAmount, 0);
  const paidToDate = payouts.filter((item) => item.status === "paid").reduce((sum, item) => sum + item.amount, 0);

  const profiles = await listProfiles();
  const downline = profiles.filter((item) => item.sponsorId === userId).length;

  return {
    profile,
    payday,
    followingPayday: following,
    thisCycle,
    nextCycle,
    paidToDate,
    downline,
    clicks7: clicks.filter((item) => now - Date.parse(item.createdAt) <= 7 * day).length,
    clicks30: clicks.filter((item) => now - Date.parse(item.createdAt) <= 30 * day).length,
    attributed: attributions.length,
    recentClicks: clicks.slice(0, 8),
    recentAttributions: attributions.slice(0, 8),
    sales: sales.slice(0, 12),
    payouts,
  };
}

export async function adminPartnershipSnapshot() {
  const profiles = await listProfiles();
  const unpaid = await unpaidApprovedSales();
  const payday = nextPayDate();
  const following = followingPayDate();
  const dueThis = unpaid
    .filter((item) => item.scheduledPayDate === payday)
    .reduce((sum, item) => sum + item.commissionAmount, 0);
  return {
    activeAffiliates: profiles.filter((item) => item.status === "active").length,
    pendingPayout: dueThis,
    payday,
    followingPayday: following,
    unpaidCount: unpaid.length,
  };
}

export async function cycleQueue(scheduledPayDate: string) {
  const unpaid = await unpaidApprovedSales();
  const grouped = new Map<string, { amount: number; sales: AffiliateSale[] }>();
  for (const sale of unpaid.filter((item) => item.scheduledPayDate === scheduledPayDate)) {
    const current = grouped.get(sale.affiliateUserId) ?? { amount: 0, sales: [] };
    current.amount += sale.commissionAmount;
    current.sales.push(sale);
    grouped.set(sale.affiliateUserId, current);
  }
  return grouped;
}

export type { AffiliatePayoutStatus };
