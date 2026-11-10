import { randomUUID } from "node:crypto";
import { Pool } from "pg";

import { PASSIVE_INCOME_EVENT_KEY } from "@/lib/passive-income-event";

export type PassiveIncomeRegistration = {
  id: string;
  name: string;
  email: string;
  phone: string;
  bestDescribesYou: string;
  ghlContactId: string;
  remindersScheduledAt: string | null;
  createdAt: string;
};

const memoryRegistrations = new Map<string, PassiveIncomeRegistration>();
let pool: Pool | null | undefined;
let tableReady = false;

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  if (pool === undefined) {
    pool = new Pool({ connectionString, ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false } });
  }
  return pool;
}

async function ensureTable(client: Pool) {
  if (tableReady) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS event_registrations (
      id TEXT PRIMARY KEY,
      event_key TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      best_describes_you TEXT NOT NULL,
      ghl_contact_id TEXT NOT NULL DEFAULT '',
      reminders_scheduled_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (event_key, email)
    )
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS event_registrations_event_created_idx ON event_registrations (event_key, created_at DESC)`);
  tableReady = true;
}

function mapRow(row: Record<string, unknown>): PassiveIncomeRegistration {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    phone: String(row.phone),
    bestDescribesYou: String(row.best_describes_you),
    ghlContactId: String(row.ghl_contact_id ?? ""),
    remindersScheduledAt: row.reminders_scheduled_at ? new Date(String(row.reminders_scheduled_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export async function createPassiveIncomeRegistration(input: { name: string; email: string; phone: string; bestDescribesYou: string }) {
  const email = input.email.trim().toLowerCase();
  const existingMemory = memoryRegistrations.get(email);
  const client = getPool();

  if (!client) {
    if (existingMemory) return { registration: existingMemory, created: false as const };
    const registration: PassiveIncomeRegistration = {
      id: `event-${randomUUID()}`,
      ...input,
      email,
      ghlContactId: "",
      remindersScheduledAt: null,
      createdAt: new Date().toISOString(),
    };
    memoryRegistrations.set(email, registration);
    return { registration, created: true as const };
  }

  await ensureTable(client);
  const id = `event-${randomUUID()}`;
  const inserted = await client.query(
    `INSERT INTO event_registrations (id, event_key, name, email, phone, best_describes_you, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
     ON CONFLICT (event_key, email) DO NOTHING RETURNING *`,
    [id, PASSIVE_INCOME_EVENT_KEY, input.name, email, input.phone, input.bestDescribesYou],
  );
  if (inserted.rows[0]) return { registration: mapRow(inserted.rows[0]), created: true as const };

  const existing = await client.query("SELECT * FROM event_registrations WHERE event_key = $1 AND email = $2 LIMIT 1", [PASSIVE_INCOME_EVENT_KEY, email]);
  return { registration: mapRow(existing.rows[0]), created: false as const };
}

export async function updatePassiveIncomeDelivery(id: string, input: { ghlContactId?: string; remindersScheduled?: boolean }) {
  for (const registration of memoryRegistrations.values()) {
    if (registration.id !== id) continue;
    if (input.ghlContactId) registration.ghlContactId = input.ghlContactId;
    if (input.remindersScheduled) registration.remindersScheduledAt = new Date().toISOString();
  }

  const client = getPool();
  if (!client) return;
  await ensureTable(client);
  await client.query(
    `UPDATE event_registrations
     SET ghl_contact_id = CASE WHEN $2 <> '' THEN $2 ELSE ghl_contact_id END,
         reminders_scheduled_at = CASE WHEN $3 THEN NOW() ELSE reminders_scheduled_at END,
         updated_at = NOW()
     WHERE id = $1`,
    [id, input.ghlContactId ?? "", Boolean(input.remindersScheduled)],
  );
}
