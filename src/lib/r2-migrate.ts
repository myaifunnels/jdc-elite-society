import { Pool } from "pg";

import { isR2Ready } from "@/lib/integrations";
import { getResolvedIntegrationSettings } from "@/lib/integrations-store";
import { extensionFor, putR2Object } from "@/lib/r2-upload";

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  return new Pool({
    connectionString,
    ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false },
  });
}

function parseDataUrl(value: string) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(value);
  if (!match) return null;
  return { contentType: match[1], buffer: Buffer.from(match[2], "base64") };
}

function randomSuffix() {
  return `migrated-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export type MigrationSummary = {
  profilePhotos: number;
  receipts: number;
  contactPhotos: number;
  errors: string[];
};

/**
 * One-time migration: finds any file still stored as a base64 data: URL
 * (the fallback used before Cloudflare R2 was connected) and re-uploads
 * it to R2, replacing the stored URL. Safe to run more than once — rows
 * that already point at R2 are skipped.
 */
export async function migrateDataUrlFilesToR2(): Promise<MigrationSummary> {
  const summary: MigrationSummary = { profilePhotos: 0, receipts: 0, contactPhotos: 0, errors: [] };
  const settings = await getResolvedIntegrationSettings();

  if (!isR2Ready(settings)) {
    summary.errors.push("Cloudflare R2 isn't fully configured yet — save all five fields first.");
    return summary;
  }

  const client = getPool();
  if (!client) {
    summary.errors.push("No database connection configured.");
    return summary;
  }

  try {
    const users = await client.query(
      "SELECT id, facebook_photo_url FROM site_users WHERE facebook_photo_url LIKE 'data:%'",
    );
    for (const row of users.rows) {
      try {
        const parsed = parseDataUrl(String(row.facebook_photo_url));
        if (!parsed) continue;
        const key = `profiles/${row.id}/${randomSuffix()}.${extensionFor(parsed.contentType)}`;
        const url = await putR2Object(settings, key, parsed.buffer, parsed.contentType);
        await client.query("UPDATE site_users SET facebook_photo_url = $2 WHERE id = $1", [row.id, url]);
        summary.profilePhotos += 1;
      } catch (error) {
        summary.errors.push(`Profile photo for user ${row.id}: ${error instanceof Error ? error.message : "failed"}`);
      }
    }

    const orders = await client.query(
      "SELECT id, email, receipt_url FROM elite_checkout_orders WHERE receipt_url LIKE 'data:%'",
    );
    for (const row of orders.rows) {
      try {
        const parsed = parseDataUrl(String(row.receipt_url));
        if (!parsed) continue;
        const safeEmail = String(row.email ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48);
        const key = `receipts/mastermind/${safeEmail}/${randomSuffix()}.${extensionFor(parsed.contentType)}`;
        const url = await putR2Object(settings, key, parsed.buffer, parsed.contentType);
        await client.query("UPDATE elite_checkout_orders SET receipt_url = $2 WHERE id = $1", [row.id, url]);
        summary.receipts += 1;
      } catch (error) {
        summary.errors.push(`Receipt for order ${row.id}: ${error instanceof Error ? error.message : "failed"}`);
      }
    }

    const contacts = await client.query(
      `SELECT id, payload FROM crm_contacts WHERE payload->>'photoUrl' LIKE 'data:%'`,
    );
    for (const row of contacts.rows) {
      try {
        const payload = row.payload as Record<string, unknown>;
        const parsed = parseDataUrl(String(payload.photoUrl ?? ""));
        if (!parsed) continue;
        const key = `contacts/${row.id}/${randomSuffix()}.${extensionFor(parsed.contentType)}`;
        const url = await putR2Object(settings, key, parsed.buffer, parsed.contentType);
        const nextPayload = { ...payload, photoUrl: url };
        await client.query("UPDATE crm_contacts SET payload = $2 WHERE id = $1", [row.id, JSON.stringify(nextPayload)]);
        summary.contactPhotos += 1;
      } catch (error) {
        summary.errors.push(`Contact photo ${row.id}: ${error instanceof Error ? error.message : "failed"}`);
      }
    }
  } catch (error) {
    summary.errors.push(error instanceof Error ? error.message : "Migration query failed.");
  } finally {
    await client.end();
  }

  return summary;
}
