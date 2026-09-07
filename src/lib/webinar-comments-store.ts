import { Pool } from "pg";

export type WebinarComment = {
  id: string;
  webinarId: string;
  userId: string;
  name: string;
  photoUrl: string;
  body: string;
  createdAt: string;
};

const memoryComments: WebinarComment[] = [];
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
    CREATE TABLE IF NOT EXISTS webinar_comments (
      id TEXT PRIMARY KEY,
      webinar_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      photo_url TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS webinar_comments_webinar_id_idx ON webinar_comments (webinar_id)`);
  tableReady = true;
}

function mapRow(row: Record<string, unknown>): WebinarComment {
  return {
    id: String(row.id),
    webinarId: String(row.webinar_id),
    userId: String(row.user_id),
    name: String(row.name ?? ""),
    photoUrl: String(row.photo_url ?? ""),
    body: String(row.body ?? ""),
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

/** Newest first, like any comment thread under a video. */
export async function listComments(webinarId: string): Promise<WebinarComment[]> {
  const client = getPool();
  if (!client) {
    return memoryComments
      .filter((comment) => comment.webinarId === webinarId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  try {
    await ensureTable(client);
    const result = await client.query(
      "SELECT * FROM webinar_comments WHERE webinar_id = $1 ORDER BY created_at DESC",
      [webinarId],
    );
    return result.rows.map(mapRow);
  } catch (error) {
    console.error("Failed to load webinar comments", error);
    return [];
  }
}

export async function createComment(input: {
  webinarId: string;
  userId: string;
  name: string;
  photoUrl?: string;
  body: string;
}): Promise<WebinarComment> {
  const now = new Date().toISOString();
  const comment: WebinarComment = {
    id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    webinarId: input.webinarId,
    userId: input.userId,
    name: input.name,
    photoUrl: input.photoUrl ?? "",
    body: input.body,
    createdAt: now,
  };

  const client = getPool();
  if (!client) {
    memoryComments.push(comment);
    return comment;
  }

  try {
    await ensureTable(client);
    await client.query(
      `INSERT INTO webinar_comments (id, webinar_id, user_id, name, photo_url, body, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [comment.id, comment.webinarId, comment.userId, comment.name, comment.photoUrl, comment.body, comment.createdAt],
    );
  } catch (error) {
    console.error("Failed to save webinar comment", error);
    throw new Error("I couldn't post that comment.");
  }

  return comment;
}

export async function deleteComment(id: string): Promise<void> {
  const memoryIndex = memoryComments.findIndex((comment) => comment.id === id);
  if (memoryIndex >= 0) memoryComments.splice(memoryIndex, 1);

  const client = getPool();
  if (!client) return;

  try {
    await ensureTable(client);
    await client.query("DELETE FROM webinar_comments WHERE id = $1", [id]);
  } catch (error) {
    console.error("Failed to delete webinar comment", error);
    throw new Error("I couldn't delete that comment.");
  }
}
