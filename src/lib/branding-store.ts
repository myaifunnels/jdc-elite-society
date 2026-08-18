import { Pool } from "pg";

import {
  BrandingSettings,
  defaultBrandingSettings,
  envBrandingSettings,
  mergeBrandingSettings,
} from "@/lib/branding";

const memoryStore: { current: BrandingSettings | null } = { current: null };

let pool: Pool | null | undefined;
let tableReady = false;

function getPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return null;
  }

  if (pool === undefined) {
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes("localhost")
        ? undefined
        : { rejectUnauthorized: false },
    });
  }

  return pool;
}

async function ensureTable(client: Pool) {
  if (tableReady) {
    return;
  }

  await client.query(`
    CREATE TABLE IF NOT EXISTS site_branding (
      id INTEGER PRIMARY KEY,
      logo_url TEXT,
      logo_href TEXT,
      logo_alt TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  tableReady = true;
}

function mapRow(row: Record<string, unknown> | undefined): BrandingSettings | null {
  if (!row) {
    return null;
  }

  return {
    logoUrl: String(row.logo_url ?? ""),
    logoHref: String(row.logo_href ?? ""),
    logoAlt: String(row.logo_alt ?? ""),
  };
}

export async function getSavedBrandingSettings(): Promise<BrandingSettings | null> {
  const client = getPool();

  if (!client) {
    return memoryStore.current;
  }

  try {
    await ensureTable(client);
    const result = await client.query("SELECT * FROM site_branding WHERE id = 1 LIMIT 1");
    return mapRow(result.rows[0]);
  } catch (error) {
    console.error("Failed to load branding settings", error);
    return memoryStore.current;
  }
}

export async function getResolvedBrandingSettings(): Promise<BrandingSettings> {
  const saved = await getSavedBrandingSettings();
  return mergeBrandingSettings(saved, envBrandingSettings());
}

export async function saveBrandingSettings(
  incoming: Partial<BrandingSettings>,
): Promise<BrandingSettings> {
  const current = (await getSavedBrandingSettings()) ?? defaultBrandingSettings;
  const next: BrandingSettings = {
    logoUrl: incoming.logoUrl ?? current.logoUrl,
    logoHref: incoming.logoHref || current.logoHref || defaultBrandingSettings.logoHref,
    logoAlt: incoming.logoAlt || current.logoAlt || defaultBrandingSettings.logoAlt,
  };

  memoryStore.current = next;

  const client = getPool();
  if (client) {
    try {
      await ensureTable(client);
      await client.query(
        `
        INSERT INTO site_branding (
          id,
          logo_url,
          logo_href,
          logo_alt,
          updated_at
        )
        VALUES (1, $1, $2, $3, NOW())
        ON CONFLICT (id) DO UPDATE SET
          logo_url = EXCLUDED.logo_url,
          logo_href = EXCLUDED.logo_href,
          logo_alt = EXCLUDED.logo_alt,
          updated_at = NOW()
        `,
        [next.logoUrl, next.logoHref, next.logoAlt],
      );
    } catch (error) {
      console.error("Failed to persist branding settings", error);
    }
  }

  return next;
}
