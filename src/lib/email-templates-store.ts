import { Pool } from "pg";

import { EMAIL_TEMPLATE_DEFINITIONS, type EmailTemplate, type EmailTemplateKey } from "@/lib/email-templates";
import { renderTemplate } from "@/lib/sms-templates";

type StoredOverride = {
  id: string;
  key: string | null;
  label: string;
  subject: string;
  html: string;
  isCustom: boolean;
  updatedAt: string;
};

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
    CREATE TABLE IF NOT EXISTS email_templates (
      id TEXT PRIMARY KEY,
      key TEXT,
      label TEXT NOT NULL,
      subject TEXT NOT NULL DEFAULT '',
      html TEXT NOT NULL,
      is_custom BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS email_templates_key_idx ON email_templates (key) WHERE key IS NOT NULL`);
  tableReady = true;
}

function mapRow(row: Record<string, unknown>): StoredOverride {
  return {
    id: String(row.id),
    key: row.key ? String(row.key) : null,
    label: String(row.label),
    subject: String(row.subject ?? ""),
    html: String(row.html),
    isCustom: row.is_custom === true || row.is_custom === "t",
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

async function listOverrides(): Promise<StoredOverride[]> {
  const client = getPool();
  if (!client) return [...memoryOverrides];

  try {
    await ensureTable(client);
    const result = await client.query("SELECT * FROM email_templates ORDER BY updated_at DESC");
    return result.rows.map(mapRow);
  } catch (error) {
    console.error("Failed to load email templates", error);
    return [...memoryOverrides];
  }
}

/** All templates: built-ins (with any saved override applied) plus admin-added custom ones. */
export async function listEmailTemplates(): Promise<EmailTemplate[]> {
  const overrides = await listOverrides();
  const overrideByKey = new Map(overrides.filter((item) => item.key).map((item) => [item.key as string, item]));

  const builtIns: EmailTemplate[] = EMAIL_TEMPLATE_DEFINITIONS.map((def) => {
    const override = overrideByKey.get(def.key);
    return {
      id: override?.id ?? def.key,
      key: def.key,
      label: def.label,
      description: def.description,
      vars: def.vars,
      subject: override?.subject || def.defaultSubject,
      html: override?.html ?? def.defaultHtml,
      isCustom: false,
      updatedAt: override?.updatedAt ?? "",
    };
  });

  const customOnes: EmailTemplate[] = overrides
    .filter((item) => item.isCustom)
    .map((item) => ({
      id: item.id,
      key: null,
      label: item.label,
      description: "Custom template — send manually from the test-email tool.",
      vars: [],
      subject: item.subject,
      html: item.html,
      isCustom: true,
      updatedAt: item.updatedAt,
    }));

  return [...builtIns, ...customOnes];
}

export async function getEmailTemplate(key: EmailTemplateKey): Promise<{ subject: string; html: string }> {
  const templates = await listEmailTemplates();
  const found = templates.find((item) => item.key === key);
  const fallback = EMAIL_TEMPLATE_DEFINITIONS.find((item) => item.key === key);
  return {
    subject: found?.subject || fallback?.defaultSubject || "",
    html: found?.html || fallback?.defaultHtml || "",
  };
}

/** Fetches a built-in template's current subject/body and renders {{vars}} into both. */
export async function renderEmailTemplate(key: EmailTemplateKey, vars: Record<string, string>) {
  const { subject, html } = await getEmailTemplate(key);
  return { subject: renderTemplate(subject, vars), html: renderTemplate(html, vars) };
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
      INSERT INTO email_templates (id, key, label, subject, html, is_custom, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (id) DO UPDATE SET
        label = EXCLUDED.label,
        subject = EXCLUDED.subject,
        html = EXCLUDED.html,
        updated_at = NOW()
      `,
      [row.id, row.key, row.label, row.subject, row.html, row.isCustom],
    );
  } catch (error) {
    console.error("Failed to save email template", error);
    throw new Error("I couldn't save that template.");
  }
}

/** Saves a subject/body override for a built-in template (key set) or creates/updates a custom one (key null). */
export async function saveEmailTemplate(input: {
  id?: string;
  key?: EmailTemplateKey | null;
  label: string;
  subject: string;
  html: string;
}) {
  const isCustom = !input.key;
  const id = input.id ?? (input.key ? input.key : `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  await upsert({
    id,
    key: input.key ?? null,
    label: input.label.trim(),
    subject: input.subject,
    html: input.html,
    isCustom,
    updatedAt: new Date().toISOString(),
  });
  return id;
}

/** Restores a built-in template to its default subject/body by removing the saved override. */
export async function resetEmailTemplate(key: EmailTemplateKey) {
  const memoryIndex = memoryOverrides.findIndex((item) => item.key === key);
  if (memoryIndex >= 0) memoryOverrides.splice(memoryIndex, 1);

  const client = getPool();
  if (!client) return;

  try {
    await ensureTable(client);
    await client.query("DELETE FROM email_templates WHERE key = $1", [key]);
  } catch (error) {
    console.error("Failed to reset email template", error);
  }
}

export async function deleteEmailTemplate(id: string) {
  const memoryIndex = memoryOverrides.findIndex((item) => item.id === id);
  if (memoryIndex >= 0) memoryOverrides.splice(memoryIndex, 1);

  const client = getPool();
  if (!client) return;

  try {
    await ensureTable(client);
    await client.query("DELETE FROM email_templates WHERE id = $1 AND is_custom = TRUE", [id]);
  } catch (error) {
    console.error("Failed to delete email template", error);
    throw new Error("I couldn't delete that template.");
  }
}
