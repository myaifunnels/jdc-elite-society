import { Pool } from "pg";

export type CommunicationChannel = "email" | "sms";

export type CommunicationLogEntry = {
  id: string;
  channel: CommunicationChannel;
  to: string;
  subject: string;
  body: string;
  createdAt: string;
};

const memoryLog: CommunicationLogEntry[] = [];
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
    CREATE TABLE IF NOT EXISTS communication_log (
      id TEXT PRIMARY KEY,
      channel TEXT NOT NULL,
      to_address TEXT NOT NULL,
      subject TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS communication_log_to_address_idx
    ON communication_log (to_address, created_at DESC)
  `);
  tableReady = true;
}

function mapRow(row: Record<string, unknown>): CommunicationLogEntry {
  return {
    id: String(row.id),
    channel: (row.channel === "sms" ? "sms" : "email") as CommunicationChannel,
    to: String(row.to_address),
    subject: String(row.subject ?? ""),
    body: String(row.body ?? ""),
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

/** Records one actually-delivered email or SMS so the recipient can see it in their dashboard
 * Inbox later — keyed by the raw "to" address/number rather than a user id, since the low-level
 * send helpers (sendEmail/sendSms) don't always know which account they're notifying. Never
 * throws: a logging failure must never take down the actual send it's recording. */
export async function logCommunication(entry: {
  channel: CommunicationChannel;
  to: string;
  subject?: string;
  body: string;
}) {
  const to = entry.to.trim().toLowerCase();
  if (!to) return;

  const record: CommunicationLogEntry = {
    id: `comm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    channel: entry.channel,
    to,
    subject: entry.subject ?? "",
    body: entry.body,
    createdAt: new Date().toISOString(),
  };

  memoryLog.unshift(record);

  const client = getPool();
  if (!client) return;

  try {
    await ensureTable(client);
    await client.query(
      `INSERT INTO communication_log (id, channel, to_address, subject, body, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [record.id, record.channel, record.to, record.subject, record.body, record.createdAt],
    );
  } catch (error) {
    console.error("Failed to log communication", error);
  }
}

/** Every email/SMS logged for any of the given addresses (typically a user's email plus their
 * phone in E.164), newest first. */
export async function listCommunicationsForRecipients(recipients: string[], limit = 100) {
  const normalized = [...new Set(recipients.map((item) => item.trim().toLowerCase()).filter(Boolean))];
  if (normalized.length === 0) return [];

  const client = getPool();
  if (!client) {
    return memoryLog
      .filter((item) => normalized.includes(item.to))
      .slice(0, limit);
  }

  try {
    await ensureTable(client);
    const result = await client.query(
      `SELECT * FROM communication_log WHERE to_address = ANY($1) ORDER BY created_at DESC LIMIT $2`,
      [normalized, limit],
    );
    return result.rows.map(mapRow);
  } catch (error) {
    console.error("Failed to list communications", error);
    return memoryLog.filter((item) => normalized.includes(item.to)).slice(0, limit);
  }
}
