import { Pool } from "pg";

/** Tracks JDC Mastermind: Duplication Season buyers who came through the GHL-hosted S2
 * Duplication Checkout Form (see the ghl-webhook/duplication routes) so the follow-up reminder
 * sweep (src/lib/duplication-reminders.ts) knows who's confirmed and which reminder stages have
 * already gone out. This is our own tracking table, separate from GHL's pipeline: nothing here
 * grants account access or course access, that stays a manual/GHL-driven decision. */

export type DuplicationEnrollmentStatus = "pending" | "confirmed" | "rejected";

export type DuplicationEnrollment = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: DuplicationEnrollmentStatus;
  remindersSent: string[];
  createdAt: string;
};

const memoryEnrollments: DuplicationEnrollment[] = [];
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
    CREATE TABLE IF NOT EXISTS duplication_enrollments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      reminders_sent TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS duplication_enrollments_email_idx
    ON duplication_enrollments (LOWER(email))
  `);
  tableReady = true;
}

function mapRow(row: Record<string, unknown>): DuplicationEnrollment {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    status: row.status === "confirmed" ? "confirmed" : row.status === "rejected" ? "rejected" : "pending",
    remindersSent: String(row.reminders_sent ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

function normalizedEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Called on checkout submission (status defaults to "pending"). Upserts by email so a
 * resubmitted form never creates a duplicate row, and never downgrades an already
 * confirmed/rejected enrollment back to pending. */
export async function upsertPendingDuplicationEnrollment(input: { name: string; email: string; phone: string }) {
  const email = normalizedEmail(input.email);
  const memoryIndex = memoryEnrollments.findIndex((item) => item.email === email);
  if (memoryIndex >= 0) {
    memoryEnrollments[memoryIndex] = { ...memoryEnrollments[memoryIndex], name: input.name, phone: input.phone };
  } else {
    memoryEnrollments.push({
      id: `dup-${Date.now()}`,
      name: input.name,
      email,
      phone: input.phone,
      status: "pending",
      remindersSent: [],
      createdAt: new Date().toISOString(),
    });
  }

  const client = getPool();
  if (!client) return;

  try {
    await ensureTable(client);
    await client.query(
      `
      INSERT INTO duplication_enrollments (id, name, email, phone, status)
      VALUES ($1, $2, $3, $4, 'pending')
      ON CONFLICT (LOWER(email)) DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone
      `,
      [`dup-${Date.now()}`, input.name, email, input.phone],
    );
  } catch (error) {
    console.error("Failed to upsert duplication enrollment", error);
  }
}

/** Called when an admin confirms or rejects the payment in GHL. Upserts by email so this still
 * works even if the verification webhook never fired for this person. */
export async function setDuplicationEnrollmentStatus(
  input: { name: string; email: string; phone: string; status: "confirmed" | "rejected" },
) {
  const email = normalizedEmail(input.email);
  const memoryIndex = memoryEnrollments.findIndex((item) => item.email === email);
  if (memoryIndex >= 0) {
    memoryEnrollments[memoryIndex] = {
      ...memoryEnrollments[memoryIndex],
      name: input.name,
      phone: input.phone,
      status: input.status,
    };
  } else {
    memoryEnrollments.push({
      id: `dup-${Date.now()}`,
      name: input.name,
      email,
      phone: input.phone,
      status: input.status,
      remindersSent: [],
      createdAt: new Date().toISOString(),
    });
  }

  const client = getPool();
  if (!client) return;

  try {
    await ensureTable(client);
    await client.query(
      `
      INSERT INTO duplication_enrollments (id, name, email, phone, status)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (LOWER(email)) DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone, status = EXCLUDED.status
      `,
      [`dup-${Date.now()}`, input.name, email, input.phone, input.status],
    );
  } catch (error) {
    console.error("Failed to set duplication enrollment status", error);
  }
}

export async function listConfirmedDuplicationEnrollments(): Promise<DuplicationEnrollment[]> {
  const client = getPool();
  if (!client) {
    return memoryEnrollments.filter((item) => item.status === "confirmed");
  }

  try {
    await ensureTable(client);
    const result = await client.query("SELECT * FROM duplication_enrollments WHERE status = 'confirmed'");
    return result.rows.map(mapRow);
  } catch (error) {
    console.error("Failed to list confirmed duplication enrollments", error);
    return memoryEnrollments.filter((item) => item.status === "confirmed");
  }
}

/** Records that a reminder stage (e.g. "session1:5d") went out for this enrollee, so the
 * reminder sweep never sends the same stage twice. Idempotent. */
export async function markDuplicationReminderSent(id: string, stage: string): Promise<void> {
  const memoryIndex = memoryEnrollments.findIndex((item) => item.id === id);
  if (memoryIndex >= 0 && !memoryEnrollments[memoryIndex].remindersSent.includes(stage)) {
    memoryEnrollments[memoryIndex] = {
      ...memoryEnrollments[memoryIndex],
      remindersSent: [...memoryEnrollments[memoryIndex].remindersSent, stage],
    };
  }

  const client = getPool();
  if (!client) return;

  try {
    await ensureTable(client);
    await client.query(
      `
      UPDATE duplication_enrollments
      SET reminders_sent = CASE
        WHEN reminders_sent = '' THEN $2
        WHEN ',' || reminders_sent || ',' LIKE '%,' || $2 || ',%' THEN reminders_sent
        ELSE reminders_sent || ',' || $2
      END
      WHERE id = $1
      `,
      [id, stage],
    );
  } catch (error) {
    console.error("Failed to record duplication reminder", error);
  }
}
