import { Pool } from "pg";

import {
  emptyIntegrationSettings,
  envIntegrationSettings,
  IntegrationSettings,
  mergeIntegrationSettings,
} from "@/lib/integrations";

const memoryStore: { current: IntegrationSettings | null } = { current: null };

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
    ADD COLUMN IF NOT EXISTS ghl_api_key TEXT
  `);
  await client.query(`
    ALTER TABLE integration_settings
    ADD COLUMN IF NOT EXISTS ghl_location_id TEXT
  `);
  await client.query(`
    ALTER TABLE integration_settings
    ADD COLUMN IF NOT EXISTS textbee_api_key TEXT
  `);
  await client.query(`
    ALTER TABLE integration_settings
    ADD COLUMN IF NOT EXISTS textbee_device_id TEXT
  `);
  await client.query(`
    ALTER TABLE integration_settings
    ADD COLUMN IF NOT EXISTS sms_from_number TEXT
  `);
  await client.query(`
    ALTER TABLE integration_settings
    ADD COLUMN IF NOT EXISTS google_client_id TEXT
  `);
  await client.query(`
    ALTER TABLE integration_settings
    ADD COLUMN IF NOT EXISTS google_client_secret TEXT
  `);
  await client.query(`
    ALTER TABLE integration_settings
    ADD COLUMN IF NOT EXISTS facebook_app_id TEXT
  `);
  await client.query(`
    ALTER TABLE integration_settings
    ADD COLUMN IF NOT EXISTS facebook_app_secret TEXT
  `);
  await client.query(`
    ALTER TABLE integration_settings
    ADD COLUMN IF NOT EXISTS email_from_address TEXT
  `);
  await client.query(`
    ALTER TABLE integration_settings
    ADD COLUMN IF NOT EXISTS email_from_name TEXT
  `);
  tableReady = true;
}

function mapRow(row: Record<string, unknown> | undefined): IntegrationSettings | null {
  if (!row) {
    return null;
  }

  return {
    googleMapsEmbedKey: String(row.google_maps_embed_key ?? ""),
    googleClientId: String(row.google_client_id ?? ""),
    googleClientSecret: String(row.google_client_secret ?? ""),
    facebookAppId: String(row.facebook_app_id ?? ""),
    facebookAppSecret: String(row.facebook_app_secret ?? ""),
    r2AccountId: String(row.r2_account_id ?? ""),
    r2AccessKeyId: String(row.r2_access_key_id ?? ""),
    r2SecretAccessKey: String(row.r2_secret_access_key ?? ""),
    r2Bucket: String(row.r2_bucket ?? ""),
    r2PublicUrl: String(row.r2_public_url ?? ""),
    ghlApiKey: String(row.ghl_api_key ?? ""),
    ghlLocationId: String(row.ghl_location_id ?? ""),
    textbeeApiKey: String(row.textbee_api_key ?? ""),
    textbeeDeviceId: String(row.textbee_device_id ?? ""),
    smsFromNumber: String(row.sms_from_number ?? ""),
    emailFromName: String(row.email_from_name ?? ""),
    emailFromAddress: String(row.email_from_address ?? ""),
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
    googleClientId: incoming.googleClientId || current.googleClientId,
    googleClientSecret: incoming.googleClientSecret || current.googleClientSecret,
    facebookAppId: incoming.facebookAppId || current.facebookAppId,
    facebookAppSecret: incoming.facebookAppSecret || current.facebookAppSecret,
    r2AccountId: incoming.r2AccountId || current.r2AccountId,
    r2AccessKeyId: incoming.r2AccessKeyId || current.r2AccessKeyId,
    r2SecretAccessKey: incoming.r2SecretAccessKey || current.r2SecretAccessKey,
    r2Bucket: incoming.r2Bucket || current.r2Bucket,
    r2PublicUrl: incoming.r2PublicUrl || current.r2PublicUrl,
    ghlApiKey: incoming.ghlApiKey || current.ghlApiKey,
    ghlLocationId: incoming.ghlLocationId || current.ghlLocationId,
    textbeeApiKey: incoming.textbeeApiKey || current.textbeeApiKey,
    textbeeDeviceId: incoming.textbeeDeviceId || current.textbeeDeviceId,
    smsFromNumber: incoming.smsFromNumber || current.smsFromNumber,
    emailFromName: incoming.emailFromName || current.emailFromName,
    emailFromAddress: incoming.emailFromAddress || current.emailFromAddress,
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
          ghl_api_key,
          ghl_location_id,
          textbee_api_key,
          textbee_device_id,
          sms_from_number,
          google_client_id,
          google_client_secret,
          facebook_app_id,
          facebook_app_secret,
          email_from_address,
          email_from_name,
          updated_at
        )
        VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
        ON CONFLICT (id) DO UPDATE SET
          google_maps_embed_key = EXCLUDED.google_maps_embed_key,
          r2_account_id = EXCLUDED.r2_account_id,
          r2_access_key_id = EXCLUDED.r2_access_key_id,
          r2_secret_access_key = EXCLUDED.r2_secret_access_key,
          r2_bucket = EXCLUDED.r2_bucket,
          r2_public_url = EXCLUDED.r2_public_url,
          ghl_api_key = EXCLUDED.ghl_api_key,
          ghl_location_id = EXCLUDED.ghl_location_id,
          textbee_api_key = EXCLUDED.textbee_api_key,
          textbee_device_id = EXCLUDED.textbee_device_id,
          sms_from_number = EXCLUDED.sms_from_number,
          google_client_id = EXCLUDED.google_client_id,
          google_client_secret = EXCLUDED.google_client_secret,
          facebook_app_id = EXCLUDED.facebook_app_id,
          facebook_app_secret = EXCLUDED.facebook_app_secret,
          email_from_address = EXCLUDED.email_from_address,
          email_from_name = EXCLUDED.email_from_name,
          updated_at = NOW()
        `,
        [
          next.googleMapsEmbedKey,
          next.r2AccountId,
          next.r2AccessKeyId,
          next.r2SecretAccessKey,
          next.r2Bucket,
          next.r2PublicUrl,
          next.ghlApiKey,
          next.ghlLocationId,
          next.textbeeApiKey,
          next.textbeeDeviceId,
          next.smsFromNumber,
          next.googleClientId,
          next.googleClientSecret,
          next.facebookAppId,
          next.facebookAppSecret,
          next.emailFromAddress,
          next.emailFromName,
        ],
      );
    } catch (error) {
      console.error("Failed to persist integration settings", error);
    }
  }

  return next;
}
