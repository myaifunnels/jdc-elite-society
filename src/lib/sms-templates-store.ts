import { Pool } from "pg";

import { SMS_TEMPLATE_DEFINITIONS, type SmsTemplate, type SmsTemplateKey } from "@/lib/sms-templates";

type StoredOverride = { id: string; key: string | null; label: string; body: string; isCustom: boolean; updatedAt: string };

const memoryOverrides: StoredOverride[] = [];
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

async function ensureTable(client: Pool) {
  if (tableReady) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS sms_templates (
      id TEXT PRIMARY KEY,
      key TEXT,
      label TEXT NOT NULL,
      body TEXT NOT NULL,
      is_custom BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS sms_templates_key_idx ON sms_templates (key) WHERE key IS NOT NULL`);
  tableReady = true;
}

function mapRow(row: Record<string, unknown>): StoredOverride {
  return {
    id: String(row.id),
    key: row.key ? String(row.key) : null,
    label: String(row.label),
    body: String(row.body),
    isCustom: row.is_custom === true || row.is_custom === "t",
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

async function listOverrides(): Promise<StoredOverride[]> {
  const client = getPool();
  if (!client) return [...memoryOverrides];

  try {
    await ensureTable(client);
    const result = await client.query("SELECT * FROM sms_templates ORDER BY updated_at DESC");
    return result.rows.map(mapRow);
  } catch (error) {
    console.error("Failed to load SMS templates", error);
    return [...memoryOverrides];
  }
}

/** All templates: built-ins (with any saved override applied) plus admin-added custom ones. */
export async function listSmsTemplates(): Promise<SmsTemplate[]> {
  const overrides = await listOverrides();
  const overrideByKey = new Map(overrides.filter((item) => item.key).map((item) => [item.key as string, item]));

  const builtIns: SmsTemplate[] = SMS_TEMPLATE_DEFINITIONS.map((def) => {
    const override = overrideByKey.get(def.key);
    return {
      id: override?.id ?? def.key,
      key: def.key,
      label: def.label,
      description: def.description,
      vars: def.vars,
      body: override?.body ?? def.defaultBody,
      isCustom: false,
      updatedAt: override?.updatedAt ?? "",
    };
  });

  const customOnes: SmsTemplate[] = overrides
    .filter((item) => item.isCustom)
    .map((item) => ({
      id: item.id,
      key: null,
      label: item.label,
      description: "Custom template — send manually from the test-text tool.",
      vars: [],
      body: item.body,
      isCustom: true,
      updatedAt: item.updatedAt,
    }));

  return [...builtIns, ...customOnes];
}

export async function getSmsTemplateBody(key: SmsTemplateKey): Promise<string> {
  const templates = await listSmsTemplates();
  const found = templates.find((item) => item.key === key);
  const fallback = SMS_TEMPLATE_DEFINITIONS.find((item) => item.key === key)?.defaultBody ?? "";
  return found?.body || fallback;
}

async function upsert(row: StoredOverride) {
  const memoryIndex = memoryOverrides.findIndex((item) => item.id === row.id);
  if (memoryIndex >= 0) {
    memoryOverrides[memoryIndex] = row;
  } else {
    memoryOverrides.unshift(row);
  }

  const client = getPool();
  if (!client) return;

  try {
    await ensureTable(client);
    await client.query(
      `
      INSERT INTO sms_templates (id, key, label, body, is_custom, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (id) DO UPDATE SET
        label = EXCLUDED.label,
        body = EXCLUDED.body,
        updated_at = NOW()
      `,
      [row.id, row.key, row.label, row.body, row.isCustom],
    );
  } catch (error) {
    console.error("Failed to save SMS template", error);
    throw new Error("I couldn't save that template.");
  }
}

/** Saves a body override for a built-in template (key set) or creates/updates a custom one (key null). */
export async function saveSmsTemplate(input: { id?: string; key?: SmsTemplateKey | null; label: string; body: string }) {
  const isCustom = !input.key;
  const id = input.id ?? (input.key ? input.key : `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  await upsert({
    id,
    key: input.key ?? null,
    label: input.label.trim(),
    body: input.body,
    isCustom,
    updatedAt: new Date().toISOString(),
  });
  return id;
}

/** Restores a built-in template to its default body by removing the saved override. */
export async function resetSmsTemplate(key: SmsTemplateKey) {
  const memoryIndex = memoryOverrides.findIndex((item) => item.key === key);
  if (memoryIndex >= 0) memoryOverrides.splice(memoryIndex, 1);

  const client = getPool();
  if (!client) return;

  try {
    await ensureTable(client);
    await client.query("DELETE FROM sms_templates WHERE key = $1", [key]);
  } catch (error) {
    console.error("Failed to reset SMS template", error);
  }
}

export async function deleteSmsTemplate(id: string) {
  const memoryIndex = memoryOverrides.findIndex((item) => item.id === id);
  if (memoryIndex >= 0) memoryOverrides.splice(memoryIndex, 1);

  const client = getPool();
  if (!client) return;

  try {
    await ensureTable(client);
    await client.query("DELETE FROM sms_templates WHERE id = $1 AND is_custom = TRUE", [id]);
  } catch (error) {
    console.error("Failed to delete SMS template", error);
    throw new Error("I couldn't delete that template.");
  }
}
