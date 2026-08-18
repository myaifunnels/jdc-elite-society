import { Pool } from "pg";

import {
  emptyIntegrationSettings,
  envIntegrationSettings,
  GhlSyncEvent,
  IntegrationSettings,
  mergeIntegrationSettings,
} from "@/lib/integrations";

const memoryStore: { current: IntegrationSettings | null } = { current: null };
const memorySyncEvents: GhlSyncEvent[] = [];

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
    CREATE TABLE IF NOT EXISTS integration_settings (
      id INTEGER PRIMARY KEY,
      google_maps_embed_key TEXT,
      r2_account_id TEXT,
      r2_access_key_id TEXT,
      r2_secret_access_key TEXT,
      r2_bucket TEXT,
      r2_public_url TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await client.query(`
    ALTER TABLE integration_settings
      ADD COLUMN IF NOT EXISTS ghl_private_token TEXT,
      ADD COLUMN IF NOT EXISTS ghl_location_id TEXT,
      ADD COLUMN IF NOT EXISTS ghl_location_name TEXT,
      ADD COLUMN IF NOT EXISTS ghl_auto_sync BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS ghl_tags TEXT,
      ADD COLUMN IF NOT EXISTS ghl_webhook_url TEXT,
      ADD COLUMN IF NOT EXISTS ghl_last_synced_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS ghl_last_error TEXT
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS ghl_sync_events (
      id SERIAL PRIMARY KEY,
      lead_id TEXT,
      name TEXT,
      email TEXT,
      phone TEXT,
      program_interest TEXT,
      ghl_contact_id TEXT,
      status TEXT NOT NULL,
      error TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  tableReady = true;
}

function mapRow(row: Record<string, unknown> | undefined): IntegrationSettings | null {
  if (!row) {
    return null;
  }

  return {
    googleMapsEmbedKey: String(row.google_maps_embed_key ?? ""),
    r2AccountId: String(row.r2_account_id ?? ""),
    r2AccessKeyId: String(row.r2_access_key_id ?? ""),
    r2SecretAccessKey: String(row.r2_secret_access_key ?? ""),
    r2Bucket: String(row.r2_bucket ?? ""),
    r2PublicUrl: String(row.r2_public_url ?? ""),
    ghlPrivateToken: String(row.ghl_private_token ?? ""),
    ghlLocationId: String(row.ghl_location_id ?? ""),
    ghlLocationName: String(row.ghl_location_name ?? ""),
    ghlAutoSync: row.ghl_auto_sync == null ? true : Boolean(row.ghl_auto_sync),
    ghlTags: String(row.ghl_tags ?? ""),
    ghlWebhookUrl: String(row.ghl_webhook_url ?? ""),
    ghlLastSyncedAt: row.ghl_last_synced_at
      ? new Date(String(row.ghl_last_synced_at)).toISOString()
      : "",
    ghlLastError: String(row.ghl_last_error ?? ""),
  };
}

function mapSyncRow(row: Record<string, unknown>): GhlSyncEvent {
  const status = String(row.status ?? "failed");

  return {
    id: String(row.id),
    leadId: String(row.lead_id ?? ""),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    programInterest: String(row.program_interest ?? ""),
    ghlContactId: String(row.ghl_contact_id ?? ""),
    status: status === "synced" || status === "skipped" ? status : "failed",
    error: String(row.error ?? ""),
    createdAt: row.created_at ? new Date(String(row.created_at)).toISOString() : "",
  };
}

export async function getSavedIntegrationSettings(): Promise<IntegrationSettings | null> {
  const client = getPool();

  if (!client) {
    return memoryStore.current;
  }

  try {
    await ensureTable(client);
    const result = await client.query(
      "SELECT * FROM integration_settings WHERE id = 1 LIMIT 1",
    );
    return mapRow(result.rows[0]);
  } catch (error) {
    console.error("Failed to load integration settings", error);
    return memoryStore.current;
  }
}

export async function getResolvedIntegrationSettings(): Promise<IntegrationSettings> {
  const saved = await getSavedIntegrationSettings();
  return mergeIntegrationSettings(saved, envIntegrationSettings());
}

export async function saveIntegrationSettings(
  incoming: Partial<IntegrationSettings>,
): Promise<IntegrationSettings> {
  const current = (await getSavedIntegrationSettings()) ?? emptyIntegrationSettings;
  const next: IntegrationSettings = {
    googleMapsEmbedKey: incoming.googleMapsEmbedKey || current.googleMapsEmbedKey,
    r2AccountId: incoming.r2AccountId || current.r2AccountId,
    r2AccessKeyId: incoming.r2AccessKeyId || current.r2AccessKeyId,
    r2SecretAccessKey: incoming.r2SecretAccessKey || current.r2SecretAccessKey,
    r2Bucket: incoming.r2Bucket || current.r2Bucket,
    r2PublicUrl: incoming.r2PublicUrl || current.r2PublicUrl,
    ghlPrivateToken: incoming.ghlPrivateToken || current.ghlPrivateToken,
    ghlLocationId: incoming.ghlLocationId || current.ghlLocationId,
    ghlLocationName: incoming.ghlLocationName || current.ghlLocationName,
    ghlAutoSync: incoming.ghlAutoSync ?? current.ghlAutoSync,
    ghlTags: incoming.ghlTags !== undefined ? incoming.ghlTags : current.ghlTags,
    ghlWebhookUrl: incoming.ghlWebhookUrl !== undefined ? incoming.ghlWebhookUrl : current.ghlWebhookUrl,
    ghlLastSyncedAt: incoming.ghlLastSyncedAt ?? current.ghlLastSyncedAt,
    ghlLastError: incoming.ghlLastError !== undefined ? incoming.ghlLastError : current.ghlLastError,
  };

  memoryStore.current = next;

  const client = getPool();
  if (client) {
    try {
      await ensureTable(client);
      await client.query(
        `
        INSERT INTO integration_settings (
          id,
          google_maps_embed_key,
          r2_account_id,
          r2_access_key_id,
          r2_secret_access_key,
          r2_bucket,
          r2_public_url,
          ghl_private_token,
          ghl_location_id,
          ghl_location_name,
          ghl_auto_sync,
          ghl_tags,
          ghl_webhook_url,
          ghl_last_synced_at,
          ghl_last_error,
          updated_at
        )
        VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
        ON CONFLICT (id) DO UPDATE SET
          google_maps_embed_key = EXCLUDED.google_maps_embed_key,
          r2_account_id = EXCLUDED.r2_account_id,
          r2_access_key_id = EXCLUDED.r2_access_key_id,
          r2_secret_access_key = EXCLUDED.r2_secret_access_key,
          r2_bucket = EXCLUDED.r2_bucket,
          r2_public_url = EXCLUDED.r2_public_url,
          ghl_private_token = EXCLUDED.ghl_private_token,
          ghl_location_id = EXCLUDED.ghl_location_id,
          ghl_location_name = EXCLUDED.ghl_location_name,
          ghl_auto_sync = EXCLUDED.ghl_auto_sync,
          ghl_tags = EXCLUDED.ghl_tags,
          ghl_webhook_url = EXCLUDED.ghl_webhook_url,
          ghl_last_synced_at = EXCLUDED.ghl_last_synced_at,
          ghl_last_error = EXCLUDED.ghl_last_error,
          updated_at = NOW()
        `,
        [
          next.googleMapsEmbedKey,
          next.r2AccountId,
          next.r2AccessKeyId,
          next.r2SecretAccessKey,
          next.r2Bucket,
          next.r2PublicUrl,
          next.ghlPrivateToken,
          next.ghlLocationId,
          next.ghlLocationName,
          next.ghlAutoSync,
          next.ghlTags,
          next.ghlWebhookUrl,
          next.ghlLastSyncedAt || null,
          next.ghlLastError,
        ],
      );
    } catch (error) {
      console.error("Failed to persist integration settings", error);
    }
  }

  return next;
}

export async function updateGhlRuntimeStatus(
  incoming: Pick<Partial<IntegrationSettings>, "ghlLastSyncedAt" | "ghlLastError" | "ghlLocationName">,
) {
  return saveIntegrationSettings(incoming);
}

export async function recordGhlSyncEvent(
  incoming: Omit<GhlSyncEvent, "id" | "createdAt">,
): Promise<GhlSyncEvent> {
  const event: GhlSyncEvent = {
    ...incoming,
    id: `ghl-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  memorySyncEvents.unshift(event);
  memorySyncEvents.splice(25);

  const client = getPool();
  if (client) {
    try {
      await ensureTable(client);
      const result = await client.query(
        `
        INSERT INTO ghl_sync_events (
          lead_id,
          name,
          email,
          phone,
          program_interest,
          ghl_contact_id,
          status,
          error,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING *
        `,
        [
          incoming.leadId,
          incoming.name,
          incoming.email,
          incoming.phone,
          incoming.programInterest,
          incoming.ghlContactId,
          incoming.status,
          incoming.error,
        ],
      );
      return mapSyncRow(result.rows[0]);
    } catch (error) {
      console.error("Failed to persist GHL sync event", error);
    }
  }

  return event;
}

export async function listGhlSyncEvents(limit = 12): Promise<GhlSyncEvent[]> {
  const client = getPool();

  if (!client) {
    return memorySyncEvents.slice(0, limit);
  }

  try {
    await ensureTable(client);
    const result = await client.query(
      "SELECT * FROM ghl_sync_events ORDER BY created_at DESC LIMIT $1",
      [limit],
    );
    return result.rows.map(mapSyncRow);
  } catch (error) {
    console.error("Failed to load GHL sync events", error);
    return memorySyncEvents.slice(0, limit);
  }
}
