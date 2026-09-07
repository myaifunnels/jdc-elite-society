import { Pool } from "pg";

import type { WebinarRecord } from "@/lib/webinars";

export type WebinarRegistrantTier = "free" | "paid_overflow";
export type WebinarRegistrantStatus = "confirmed" | "pending" | "rejected";

export type WebinarRegistrant = {
  id: string;
  webinarId: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  photoUrl: string;
  tier: WebinarRegistrantTier;
  status: WebinarRegistrantStatus;
  paymentReceiptUrl: string;
  amountPaid: number;
  remindersSent: string[];
  createdAt: string;
};

export type CreateRegistrantInput = {
  webinarId: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  photoUrl?: string;
  tier: WebinarRegistrantTier;
  paymentReceiptUrl?: string;
  amountPaid?: number;
};

const memoryRegistrants: WebinarRegistrant[] = [];
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
    CREATE TABLE IF NOT EXISTS webinar_registrants (
      id TEXT PRIMARY KEY,
      webinar_id TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      photo_url TEXT NOT NULL DEFAULT '',
      tier TEXT NOT NULL DEFAULT 'free',
      status TEXT NOT NULL DEFAULT 'pending',
      payment_receipt_url TEXT NOT NULL DEFAULT '',
      amount_paid INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`ALTER TABLE webinar_registrants ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT ''`);
  await client.query(`ALTER TABLE webinar_registrants ADD COLUMN IF NOT EXISTS reminders_sent TEXT NOT NULL DEFAULT ''`);
  await client.query(`
    CREATE INDEX IF NOT EXISTS webinar_registrants_webinar_idx
    ON webinar_registrants (webinar_id, status, tier)
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS webinar_registrants_user_idx
    ON webinar_registrants (user_id)
  `);
  tableReady = true;
}

function mapRow(row: Record<string, unknown>): WebinarRegistrant {
  return {
    id: String(row.id),
    webinarId: String(row.webinar_id),
    userId: String(row.user_id ?? ""),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    photoUrl: String(row.photo_url ?? ""),
    tier: row.tier === "paid_overflow" ? "paid_overflow" : "free",
    status: row.status === "confirmed" ? "confirmed" : row.status === "rejected" ? "rejected" : "pending",
    paymentReceiptUrl: String(row.payment_receipt_url ?? ""),
    amountPaid: Number(row.amount_paid ?? 0),
    remindersSent: String(row.reminders_sent ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export async function listRegistrants(webinarId: string): Promise<WebinarRegistrant[]> {
  const client = getPool();
  if (!client) {
    return memoryRegistrants
      .filter((item) => item.webinarId === webinarId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  try {
    await ensureTable(client);
    const result = await client.query(
      "SELECT * FROM webinar_registrants WHERE webinar_id = $1 ORDER BY created_at DESC",
      [webinarId],
    );
    return result.rows.map(mapRow);
  } catch (error) {
    console.error("Failed to load webinar registrants", error);
    return memoryRegistrants
      .filter((item) => item.webinarId === webinarId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
}

/** One person occupies at most one seat — key by userId (falling back to email for
 * pre-userId-column rows) so a duplicate registration row for the same person, however it got
 * created, is never counted twice against the seat cap. */
function countUniquePeople(registrants: WebinarRegistrant[]): number {
  const seen = new Set<string>();
  for (const registrant of registrants) {
    seen.add(registrant.userId || registrant.email);
  }
  return seen.size;
}

/** Both free-confirmed and paid-overflow-confirmed count as an occupied seat. */
export async function countConfirmedRegistrants(webinarId: string): Promise<number> {
  const all = await listRegistrants(webinarId);
  return countUniquePeople(all.filter((item) => item.status === "confirmed"));
}

async function countFreeConfirmedRegistrants(webinarId: string): Promise<number> {
  const all = await listRegistrants(webinarId);
  return countUniquePeople(all.filter((item) => item.status === "confirmed" && item.tier === "free"));
}

/** How many free seats remain. Never negative. This is the single source of truth the
 * public registration route and the hero UI must both derive from. */
export async function getFreeSeatsLeft(webinar: WebinarRecord): Promise<number> {
  const freeConfirmed = await countFreeConfirmedRegistrants(webinar.id);
  return Math.max(0, webinar.totalSeats - freeConfirmed);
}

export async function createRegistrant(input: CreateRegistrantInput): Promise<WebinarRegistrant> {
  const registrant: WebinarRegistrant = {
    id: `reg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    webinarId: input.webinarId,
    userId: input.userId ?? "",
    name: input.name,
    email: input.email.toLowerCase(),
    phone: input.phone,
    photoUrl: input.photoUrl ?? "",
    tier: input.tier,
    status: input.tier === "free" ? "confirmed" : "pending",
    paymentReceiptUrl: input.paymentReceiptUrl ?? "",
    amountPaid: input.amountPaid ?? 0,
    remindersSent: [],
    createdAt: new Date().toISOString(),
  };

  memoryRegistrants.unshift(registrant);

  const client = getPool();
  if (!client) return registrant;

  try {
    await ensureTable(client);
    await client.query(
      `
      INSERT INTO webinar_registrants (
        id, webinar_id, user_id, name, email, phone, photo_url, tier, status, payment_receipt_url, amount_paid, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `,
      [
        registrant.id,
        registrant.webinarId,
        registrant.userId,
        registrant.name,
        registrant.email,
        registrant.phone,
        registrant.photoUrl,
        registrant.tier,
        registrant.status,
        registrant.paymentReceiptUrl,
        registrant.amountPaid,
        registrant.createdAt,
      ],
    );
  } catch (error) {
    const memoryIndex = memoryRegistrants.findIndex((item) => item.id === registrant.id);
    if (memoryIndex >= 0) memoryRegistrants.splice(memoryIndex, 1);
    console.error("Failed to save webinar registrant", error);
    throw new Error("I couldn't save that registration. Please try again.");
  }

  return registrant;
}

export async function updateRegistrantStatus(
  id: string,
  status: WebinarRegistrantStatus,
): Promise<WebinarRegistrant> {
  const memoryIndex = memoryRegistrants.findIndex((item) => item.id === id);
  if (memoryIndex >= 0) {
    memoryRegistrants[memoryIndex] = { ...memoryRegistrants[memoryIndex], status };
  }

  const client = getPool();
  if (client) {
    try {
      await ensureTable(client);
      const result = await client.query(
        "UPDATE webinar_registrants SET status = $2 WHERE id = $1 RETURNING *",
        [id, status],
      );
      if (!result.rows[0]) throw new Error("Registrant not found.");
      return mapRow(result.rows[0]);
    } catch (error) {
      console.error("Failed to update webinar registrant status", error);
      throw error instanceof Error ? error : new Error("I couldn't update that registrant.");
    }
  }

  if (memoryIndex < 0) throw new Error("Registrant not found.");
  return memoryRegistrants[memoryIndex];
}

const STATUS_RANK: Record<WebinarRegistrantStatus, number> = { confirmed: 2, pending: 1, rejected: 0 };

/** Collapses multiple registrant rows for the same webinar down to one — a pre-existing gap in
 * the public register route let an already-registered visitor (a double-click, a resubmitted
 * form after a network hiccup, or registering again while already signed in) create a second row
 * for the same webinar. The register route now guards against this going forward, but this keeps
 * any duplicates already in the database from ever being shown: keeps whichever row is furthest
 * along (confirmed > pending > rejected), and the most recent one for ties. */
function dedupeByWebinar(registrants: WebinarRegistrant[]): WebinarRegistrant[] {
  const best = new Map<string, WebinarRegistrant>();
  for (const registrant of registrants) {
    const current = best.get(registrant.webinarId);
    if (
      !current ||
      STATUS_RANK[registrant.status] > STATUS_RANK[current.status] ||
      (STATUS_RANK[registrant.status] === STATUS_RANK[current.status] && registrant.createdAt > current.createdAt)
    ) {
      best.set(registrant.webinarId, registrant);
    }
  }
  return [...best.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Every registration tied to a given account, newest first — matched by userId, and (for
 * registrations created before the userId column existed) by the account's email as a fallback.
 * Collapsed to one row per webinar via dedupeByWebinar. */
export async function listRegistrantsByUserId(userId: string, email?: string): Promise<WebinarRegistrant[]> {
  const normalizedEmail = email?.trim().toLowerCase() ?? "";
  const client = getPool();
  if (!client) {
    return dedupeByWebinar(
      memoryRegistrants.filter((item) => item.userId === userId || (normalizedEmail && item.email === normalizedEmail)),
    );
  }

  try {
    await ensureTable(client);
    const result = normalizedEmail
      ? await client.query(
          "SELECT * FROM webinar_registrants WHERE user_id = $1 OR email = $2 ORDER BY created_at DESC",
          [userId, normalizedEmail],
        )
      : await client.query(
          "SELECT * FROM webinar_registrants WHERE user_id = $1 ORDER BY created_at DESC",
          [userId],
        );
    return dedupeByWebinar(result.rows.map(mapRow));
  } catch (error) {
    console.error("Failed to load webinar registrants for user", error);
    return dedupeByWebinar(
      memoryRegistrants.filter((item) => item.userId === userId || (normalizedEmail && item.email === normalizedEmail)),
    );
  }
}

/** A single account's existing registration for one specific webinar, if any — matched by
 * userId first, falling back to email (same fallback listRegistrantsByUserId uses). Used by the
 * sign-in-then-register flow so signing in twice for the same webinar never double-registers. */
export async function findRegistrantByUserAndWebinar(
  webinarId: string,
  userId: string,
  email?: string,
): Promise<WebinarRegistrant | null> {
  const normalizedEmail = email?.trim().toLowerCase() ?? "";
  const all = await listRegistrants(webinarId);
  return (
    all.find(
      (item) => (userId && item.userId === userId) || (normalizedEmail && item.email === normalizedEmail),
    ) ?? null
  );
}

/** Records that a reminder stage (e.g. "3d", "2d", "dayof", "start") went out for this
 * registrant, so the reminder sweep never sends the same stage twice. Idempotent — calling it
 * again for a stage that's already recorded is a no-op. */
export async function markReminderSent(id: string, stage: string): Promise<void> {
  const memoryIndex = memoryRegistrants.findIndex((item) => item.id === id);
  if (memoryIndex >= 0 && !memoryRegistrants[memoryIndex].remindersSent.includes(stage)) {
    memoryRegistrants[memoryIndex] = {
      ...memoryRegistrants[memoryIndex],
      remindersSent: [...memoryRegistrants[memoryIndex].remindersSent, stage],
    };
  }

  const client = getPool();
  if (!client) return;

  try {
    await ensureTable(client);
    await client.query(
      `
      UPDATE webinar_registrants
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
    console.error("Failed to record webinar reminder", error);
  }
}

/** Global queue of paid-overflow registrations awaiting admin review, across every webinar. */
export async function listPendingOverflowRegistrants(): Promise<WebinarRegistrant[]> {
  const client = getPool();
  if (!client) {
    return memoryRegistrants
      .filter((item) => item.tier === "paid_overflow" && item.status === "pending")
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  try {
    await ensureTable(client);
    const result = await client.query(
      "SELECT * FROM webinar_registrants WHERE tier = 'paid_overflow' AND status = 'pending' ORDER BY created_at DESC",
    );
    return result.rows.map(mapRow);
  } catch (error) {
    console.error("Failed to load pending overflow registrants", error);
    return memoryRegistrants
      .filter((item) => item.tier === "paid_overflow" && item.status === "pending")
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
}
