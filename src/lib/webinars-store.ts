import { Pool } from "pg";

import { PASSIVE_INCOME_EVENT_START, PASSIVE_INCOME_EVENT_TITLE } from "@/lib/passive-income-event";
import type { WebinarInput, WebinarRecord } from "@/lib/webinars";

const memoryWebinars: WebinarRecord[] = [];
let pool: Pool | null | undefined;
let tableReady = false;

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  if (pool === undefined) {
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false },
    });
  }
  return pool;
}

function seedRecord(): WebinarRecord {
  const now = new Date().toISOString();
  return {
    id: "seed-passive-income",
    episodeNumber: 1,
    seasonLabel: "Season 1",
    title: PASSIVE_INCOME_EVENT_TITLE,
    tagline: "Build income that keeps working after you stop.",
    description:
      "Learn the practical systems and habits that help a network marketing business grow beyond your personal effort.",
    hostName: "Coach JDC",
    hostTitle: "Founder, JDC Elite Society",
    scheduledAt: PASSIVE_INCOME_EVENT_START,
    thumbnailUrl: "",
    ctaLabel: "Reserve your free seat",
    ctaHref: "/passive-income",
    zoomLink: "",
    interestedCount: 0,
    isFeatured: true,
    totalSeats: 100,
    grantsUniversityAccess: true,
    createdAt: now,
    updatedAt: now,
  };
}

async function ensureTable(client: Pool) {
  if (tableReady) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS webinars (
      id TEXT PRIMARY KEY,
      episode_number INTEGER NOT NULL DEFAULT 1,
      season_label TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      tagline TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      host_name TEXT NOT NULL DEFAULT '',
      host_title TEXT NOT NULL DEFAULT '',
      scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      thumbnail_url TEXT NOT NULL DEFAULT '',
      cta_label TEXT NOT NULL DEFAULT '',
      cta_href TEXT NOT NULL DEFAULT '',
      interested_count INTEGER NOT NULL DEFAULT 0,
      is_featured BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`ALTER TABLE webinars ADD COLUMN IF NOT EXISTS thumbnail_url TEXT NOT NULL DEFAULT ''`);
  await client.query(`ALTER TABLE webinars ADD COLUMN IF NOT EXISTS interested_count INTEGER NOT NULL DEFAULT 0`);
  await client.query(`ALTER TABLE webinars ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE`);
  await client.query(`ALTER TABLE webinars ADD COLUMN IF NOT EXISTS total_seats INTEGER NOT NULL DEFAULT 100`);
  await client.query(`ALTER TABLE webinars ADD COLUMN IF NOT EXISTS zoom_link TEXT NOT NULL DEFAULT ''`);
  await client.query(
    `ALTER TABLE webinars ADD COLUMN IF NOT EXISTS grants_university_access BOOLEAN NOT NULL DEFAULT TRUE`,
  );
  tableReady = true;

  const existing = await client.query("SELECT COUNT(*)::int AS count FROM webinars");
  const count = Number(existing.rows[0]?.count ?? 0);
  if (count === 0) {
    const seed = seedRecord();
    await client.query(
      `
      INSERT INTO webinars (
        id, episode_number, season_label, title, tagline, description, host_name, host_title,
        scheduled_at, thumbnail_url, cta_label, cta_href, zoom_link, interested_count, is_featured, total_seats, grants_university_access, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      ON CONFLICT (id) DO NOTHING
      `,
      [
        seed.id,
        seed.episodeNumber,
        seed.seasonLabel,
        seed.title,
        seed.tagline,
        seed.description,
        seed.hostName,
        seed.hostTitle,
        seed.scheduledAt,
        seed.thumbnailUrl,
        seed.ctaLabel,
        seed.ctaHref,
        seed.zoomLink,
        seed.interestedCount,
        seed.isFeatured,
        seed.totalSeats,
        seed.grantsUniversityAccess,
        seed.createdAt,
        seed.updatedAt,
      ],
    );
  }
}

function mapRow(row: Record<string, unknown>): WebinarRecord {
  return {
    id: String(row.id),
    episodeNumber: Number(row.episode_number ?? 1),
    seasonLabel: String(row.season_label ?? ""),
    title: String(row.title ?? ""),
    tagline: String(row.tagline ?? ""),
    description: String(row.description ?? ""),
    hostName: String(row.host_name ?? ""),
    hostTitle: String(row.host_title ?? ""),
    scheduledAt: new Date(String(row.scheduled_at)).toISOString(),
    thumbnailUrl: String(row.thumbnail_url ?? ""),
    ctaLabel: String(row.cta_label ?? ""),
    ctaHref: String(row.cta_href ?? ""),
    zoomLink: String(row.zoom_link ?? ""),
    interestedCount: Number(row.interested_count ?? 0),
    isFeatured: row.is_featured === true || row.is_featured === "t",
    totalSeats: Number(row.total_seats ?? 100),
    grantsUniversityAccess: row.grants_university_access !== false && row.grants_university_access !== "f",
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function ensureMemorySeed() {
  if (memoryWebinars.length === 0) {
    memoryWebinars.push(seedRecord());
  }
}

export async function listWebinars(): Promise<WebinarRecord[]> {
  const client = getPool();
  if (!client) {
    ensureMemorySeed();
    return [...memoryWebinars].sort((a, b) => (a.scheduledAt < b.scheduledAt ? 1 : -1));
  }

  try {
    await ensureTable(client);
    const result = await client.query("SELECT * FROM webinars ORDER BY scheduled_at DESC");
    return result.rows.map(mapRow);
  } catch (error) {
    console.error("Failed to load webinars", error);
    ensureMemorySeed();
    return [...memoryWebinars].sort((a, b) => (a.scheduledAt < b.scheduledAt ? 1 : -1));
  }
}

export async function getWebinar(id: string): Promise<WebinarRecord | null> {
  const all = await listWebinars();
  return all.find((item) => item.id === id) ?? null;
}

/** The webinar the public page should headline: the one flagged featured, else the soonest
 * upcoming by scheduledAt, else the most recent one. */
export async function getFeaturedWebinar(): Promise<WebinarRecord | null> {
  const all = await listWebinars();
  if (all.length === 0) return null;

  const featured = all.find((item) => item.isFeatured);
  if (featured) return featured;

  const now = Date.now();
  const upcoming = all
    .filter((item) => new Date(item.scheduledAt).getTime() >= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  if (upcoming.length > 0) return upcoming[0];

  const mostRecent = [...all].sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
  );
  return mostRecent[0] ?? null;
}

async function setFeaturedFlag(client: Pool | null, id: string) {
  for (const item of memoryWebinars) {
    item.isFeatured = item.id === id;
  }

  if (!client) return;
  await ensureTable(client);
  await client.query("UPDATE webinars SET is_featured = FALSE WHERE id <> $1", [id]);
  await client.query("UPDATE webinars SET is_featured = TRUE WHERE id = $1", [id]);
}

export async function setFeaturedWebinar(id: string): Promise<void> {
  const client = getPool();
  if (!client) {
    ensureMemorySeed();
    const found = memoryWebinars.some((item) => item.id === id);
    if (!found) throw new Error("Webinar not found.");
    await setFeaturedFlag(null, id);
    return;
  }

  try {
    await ensureTable(client);
    const existing = await client.query("SELECT id FROM webinars WHERE id = $1", [id]);
    if (existing.rowCount === 0) throw new Error("Webinar not found.");
    await setFeaturedFlag(client, id);
  } catch (error) {
    console.error("Failed to set featured webinar", error);
    throw error instanceof Error ? error : new Error("I couldn't update the featured webinar.");
  }
}

export async function saveWebinar(input: WebinarInput): Promise<WebinarRecord> {
  const now = new Date().toISOString();
  const client = getPool();

  const existing = input.id ? await getWebinar(input.id) : null;
  const record: WebinarRecord = {
    id: existing?.id ?? input.id ?? `webinar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    episodeNumber: input.episodeNumber ?? existing?.episodeNumber ?? 1,
    seasonLabel: input.seasonLabel ?? existing?.seasonLabel ?? "Season 1",
    title: input.title ?? existing?.title ?? "",
    tagline: input.tagline ?? existing?.tagline ?? "",
    description: input.description ?? existing?.description ?? "",
    hostName: input.hostName ?? existing?.hostName ?? "",
    hostTitle: input.hostTitle ?? existing?.hostTitle ?? "",
    scheduledAt: input.scheduledAt ?? existing?.scheduledAt ?? now,
    thumbnailUrl: input.thumbnailUrl ?? existing?.thumbnailUrl ?? "",
    ctaLabel: input.ctaLabel ?? existing?.ctaLabel ?? "",
    ctaHref: input.ctaHref ?? existing?.ctaHref ?? "",
    zoomLink: input.zoomLink ?? existing?.zoomLink ?? "",
    interestedCount: input.interestedCount ?? existing?.interestedCount ?? 0,
    isFeatured: input.isFeatured ?? existing?.isFeatured ?? false,
    totalSeats: input.totalSeats ?? existing?.totalSeats ?? 100,
    grantsUniversityAccess: input.grantsUniversityAccess ?? existing?.grantsUniversityAccess ?? true,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const memoryIndex = memoryWebinars.findIndex((item) => item.id === record.id);
  if (memoryIndex >= 0) {
    memoryWebinars[memoryIndex] = record;
  } else {
    memoryWebinars.unshift(record);
  }

  if (!client) {
    if (record.isFeatured) {
      for (const item of memoryWebinars) {
        item.isFeatured = item.id === record.id;
      }
    }
    return record;
  }

  try {
    await ensureTable(client);
    await client.query(
      `
      INSERT INTO webinars (
        id, episode_number, season_label, title, tagline, description, host_name, host_title,
        scheduled_at, thumbnail_url, cta_label, cta_href, zoom_link, interested_count, is_featured, total_seats, grants_university_access, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      ON CONFLICT (id) DO UPDATE SET
        episode_number = EXCLUDED.episode_number,
        season_label = EXCLUDED.season_label,
        title = EXCLUDED.title,
        tagline = EXCLUDED.tagline,
        description = EXCLUDED.description,
        host_name = EXCLUDED.host_name,
        host_title = EXCLUDED.host_title,
        scheduled_at = EXCLUDED.scheduled_at,
        thumbnail_url = EXCLUDED.thumbnail_url,
        cta_label = EXCLUDED.cta_label,
        cta_href = EXCLUDED.cta_href,
        zoom_link = EXCLUDED.zoom_link,
        interested_count = EXCLUDED.interested_count,
        is_featured = EXCLUDED.is_featured,
        total_seats = EXCLUDED.total_seats,
        grants_university_access = EXCLUDED.grants_university_access,
        updated_at = EXCLUDED.updated_at
      `,
      [
        record.id,
        record.episodeNumber,
        record.seasonLabel,
        record.title,
        record.tagline,
        record.description,
        record.hostName,
        record.hostTitle,
        record.scheduledAt,
        record.thumbnailUrl,
        record.ctaLabel,
        record.ctaHref,
        record.zoomLink,
        record.interestedCount,
        record.isFeatured,
        record.totalSeats,
        record.grantsUniversityAccess,
        record.createdAt,
        record.updatedAt,
      ],
    );
    if (record.isFeatured) {
      await client.query("UPDATE webinars SET is_featured = FALSE WHERE id <> $1", [record.id]);
    }
  } catch (error) {
    console.error("Failed to save webinar", error);
    throw new Error("I couldn't save that webinar.");
  }

  return record;
}

export async function deleteWebinar(id: string): Promise<void> {
  const memoryIndex = memoryWebinars.findIndex((item) => item.id === id);
  if (memoryIndex >= 0) memoryWebinars.splice(memoryIndex, 1);

  const client = getPool();
  if (!client) return;

  try {
    await ensureTable(client);
    await client.query("DELETE FROM webinars WHERE id = $1", [id]);
  } catch (error) {
    console.error("Failed to delete webinar", error);
    throw new Error("I couldn't delete that webinar.");
  }
}
