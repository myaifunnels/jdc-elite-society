import { Pool } from "pg";

export type AppNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  href: string;
  kind: string;
  readAt: string | null;
  createdAt: string;
};

const memoryNotes: AppNotification[] = [];
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
    CREATE TABLE IF NOT EXISTS app_notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      href TEXT NOT NULL DEFAULT '',
      kind TEXT NOT NULL DEFAULT 'activity',
      read_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS app_notifications_user_created_idx
    ON app_notifications (user_id, created_at DESC)
  `);
  tableReady = true;
}

function mapRow(row: Record<string, unknown>): AppNotification {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title),
    body: String(row.body ?? ""),
    href: String(row.href ?? ""),
    kind: String(row.kind ?? "activity"),
    readAt: row.read_at ? new Date(String(row.read_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export async function createNotifications(
  userIds: string[],
  input: { title: string; body: string; href?: string; kind?: string },
) {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return [];

  const created: AppNotification[] = unique.map((userId) => ({
    id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    title: input.title,
    body: input.body,
    href: input.href ?? "",
    kind: input.kind ?? "activity",
    readAt: null,
    createdAt: new Date().toISOString(),
  }));

  memoryNotes.unshift(...created);

  const client = getPool();
  if (!client) return created;

  try {
    await ensureTable(client);
    for (const note of created) {
      await client.query(
        `
        INSERT INTO app_notifications (id, user_id, title, body, href, kind, read_at, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NULL, $7)
        `,
        [note.id, note.userId, note.title, note.body, note.href, note.kind, note.createdAt],
      );
    }
  } catch (error) {
    console.error("Failed to save notifications", error);
  }

  return created;
}

export async function listNotificationsForUser(userId: string, limit = 20) {
  const client = getPool();
  if (!client) {
    return memoryNotes.filter((item) => item.userId === userId).slice(0, limit);
  }

  try {
    await ensureTable(client);
    const result = await client.query(
      `SELECT * FROM app_notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [userId, limit],
    );
    return result.rows.map(mapRow);
  } catch (error) {
    console.error("Failed to list notifications", error);
    return memoryNotes.filter((item) => item.userId === userId).slice(0, limit);
  }
}

export async function countUnreadNotifications(userId: string) {
  const items = await listNotificationsForUser(userId, 50);
  return items.filter((item) => !item.readAt).length;
}

export async function markNotificationRead(userId: string, id: string) {
  const now = new Date().toISOString();
  for (const note of memoryNotes) {
    if (note.id === id && note.userId === userId) {
      note.readAt = now;
    }
  }

  const client = getPool();
  if (!client) return;

  try {
    await ensureTable(client);
    await client.query(
      `UPDATE app_notifications SET read_at = $3 WHERE id = $1 AND user_id = $2 AND read_at IS NULL`,
      [id, userId, now],
    );
  } catch (error) {
    console.error("Failed to mark notification read", error);
  }
}

export async function markAllNotificationsRead(userId: string) {
  const now = new Date().toISOString();
  for (const note of memoryNotes) {
    if (note.userId === userId && !note.readAt) {
      note.readAt = now;
    }
  }

  const client = getPool();
  if (!client) return;

  try {
    await ensureTable(client);
    await client.query(`UPDATE app_notifications SET read_at = $2 WHERE user_id = $1 AND read_at IS NULL`, [
      userId,
      now,
    ]);
  } catch (error) {
    console.error("Failed to mark notifications read", error);
  }
}
