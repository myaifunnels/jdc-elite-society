import { Pool } from "pg";

import { listEliteCheckoutOrdersForUser } from "@/lib/elite-checkout-store";

export type UserProgramStatus = "active" | "completed" | "cancelled";
export type UserProgramSource = "checkout" | "webinar" | "membership" | "admin";

export type UserProgram = {
  id: string;
  userId: string;
  programSlug: string;
  status: UserProgramStatus;
  source: UserProgramSource;
  sourceRef: string;
  availedAt: string;
  notes: string;
};

const memoryPrograms: UserProgram[] = [];
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
    CREATE TABLE IF NOT EXISTS user_programs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      program_slug TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      source TEXT NOT NULL DEFAULT 'admin',
      source_ref TEXT NOT NULL DEFAULT '',
      availed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      notes TEXT NOT NULL DEFAULT '',
      UNIQUE (user_id, program_slug)
    )
  `);
  tableReady = true;
}

function parseStatus(value: unknown): UserProgramStatus {
  return value === "completed" || value === "cancelled" ? value : "active";
}

function parseSource(value: unknown): UserProgramSource {
  return value === "checkout" || value === "webinar" || value === "membership" ? value : "admin";
}

function mapRow(row: Record<string, unknown>): UserProgram {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    programSlug: String(row.program_slug),
    status: parseStatus(row.status),
    source: parseSource(row.source),
    sourceRef: String(row.source_ref ?? ""),
    availedAt: new Date(String(row.availed_at)).toISOString(),
    notes: String(row.notes ?? ""),
  };
}

export async function listUserPrograms(userId: string): Promise<UserProgram[]> {
  const client = getPool();
  if (!client) {
    return memoryPrograms.filter((item) => item.userId === userId);
  }

  await ensureTable(client);
  const result = await client.query("SELECT * FROM user_programs WHERE user_id = $1 ORDER BY availed_at DESC", [userId]);
  return result.rows.map(mapRow);
}

export async function upsertUserProgram(input: {
  userId: string;
  programSlug: string;
  status?: UserProgramStatus;
  source: UserProgramSource;
  sourceRef?: string;
  availedAt?: string;
  notes?: string;
}) {
  const record: UserProgram = {
    id: `up-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: input.userId,
    programSlug: input.programSlug,
    status: input.status ?? "active",
    source: input.source,
    sourceRef: input.sourceRef ?? "",
    availedAt: input.availedAt ?? new Date().toISOString(),
    notes: input.notes ?? "",
  };

  const client = getPool();
  if (!client) {
    const index = memoryPrograms.findIndex(
      (item) => item.userId === record.userId && item.programSlug === record.programSlug,
    );
    if (index >= 0) memoryPrograms[index] = { ...record, id: memoryPrograms[index].id };
    else memoryPrograms.unshift(record);
    return record;
  }

  await ensureTable(client);
  const result = await client.query(
    `
    INSERT INTO user_programs (id, user_id, program_slug, status, source, source_ref, availed_at, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (user_id, program_slug) DO UPDATE
    SET status = EXCLUDED.status, source = EXCLUDED.source, source_ref = EXCLUDED.source_ref, notes = EXCLUDED.notes
    RETURNING *
    `,
    [record.id, record.userId, record.programSlug, record.status, record.source, record.sourceRef, record.availedAt, record.notes],
  );
  return mapRow(result.rows[0]);
}

export async function removeUserProgram(userId: string, programSlug: string) {
  const index = memoryPrograms.findIndex((item) => item.userId === userId && item.programSlug === programSlug);
  if (index >= 0) memoryPrograms.splice(index, 1);

  const client = getPool();
  if (client) {
    await ensureTable(client);
    await client.query("DELETE FROM user_programs WHERE user_id = $1 AND program_slug = $2", [userId, programSlug]);
  }
}

/** Approved Elite/Mastermind checkouts count as availed programs. Runs on read so past approvals
 * are backfilled without touching the approval flow. */
export async function syncUserProgramsFromCheckouts(userId: string) {
  const existing = new Set((await listUserPrograms(userId)).map((item) => item.programSlug));
  const orders = await listEliteCheckoutOrdersForUser(userId);
  const approved = orders.filter((order) => order.status === "approved");
  if (approved.length > 0 && !existing.has("jdc-elite-society")) {
    const first = approved[approved.length - 1];
    await upsertUserProgram({
      userId,
      programSlug: "jdc-elite-society",
      source: "checkout",
      sourceRef: first.id,
      availedAt: first.approvedAt || first.createdAt,
    });
  }
}
