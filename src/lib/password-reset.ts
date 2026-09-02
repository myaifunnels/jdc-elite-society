import { createHash, randomBytes, randomInt } from "node:crypto";

import { Pool } from "pg";

type ResetRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  codeHash: string;
  expiresAt: Date;
  usedAt: Date | null;
};

const memoryResets: ResetRecord[] = [];
let resetTableReady = false;

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function ensureResetTable(client: Pool) {
  if (resetTableReady) {
    return;
  }

  await client.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ
    )
  `);
  await client.query(`
    ALTER TABLE password_reset_tokens
    ADD COLUMN IF NOT EXISTS code_hash TEXT NOT NULL DEFAULT ''
  `);
  resetTableReady = true;
}

export async function createPasswordResetToken(client: Pool | null, userId: string) {
  const token = randomBytes(32).toString("hex");
  const code = String(randomInt(100000, 1000000));
  const record: ResetRecord = {
    id: `reset-${Date.now()}-${randomBytes(4).toString("hex")}`,
    userId,
    tokenHash: tokenHash(token),
    codeHash: tokenHash(code),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    usedAt: null,
  };

  for (const item of memoryResets) {
    if (item.userId === userId && !item.usedAt) {
      item.usedAt = new Date();
    }
  }
  memoryResets.unshift(record);

  if (client) {
    try {
      await ensureResetTable(client);
      await client.query(
        `UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL`,
        [userId],
      );
      await client.query(
        `
        INSERT INTO password_reset_tokens (id, user_id, token_hash, code_hash, expires_at, used_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [record.id, record.userId, record.tokenHash, record.codeHash, record.expiresAt.toISOString(), null],
      );
    } catch (error) {
      console.error("Failed to persist password reset token", error);
    }
  }

  return { token, code };
}

function isOpen(record: ResetRecord | null, now: Date) {
  return Boolean(record && !record.usedAt && record.expiresAt.getTime() >= now.getTime());
}

async function markUsed(client: Pool | null, record: ResetRecord, now: Date) {
  record.usedAt = now;
  if (!client) return;
  try {
    await ensureResetTable(client);
    await client.query("UPDATE password_reset_tokens SET used_at = $2 WHERE id = $1", [record.id, now.toISOString()]);
  } catch (error) {
    console.error("Failed to consume password reset token", error);
  }
}

export async function consumePasswordResetToken(client: Pool | null, token: string) {
  const hash = tokenHash(token);
  const now = new Date();
  let record = memoryResets.find((item) => item.tokenHash === hash && !item.usedAt) ?? null;

  if (client) {
    try {
      await ensureResetTable(client);
      const result = await client.query(
        `SELECT * FROM password_reset_tokens WHERE token_hash = $1 AND used_at IS NULL LIMIT 1`,
        [hash],
      );
      if (result.rows[0]) {
        record = {
          id: String(result.rows[0].id),
          userId: String(result.rows[0].user_id),
          tokenHash: String(result.rows[0].token_hash),
          codeHash: String(result.rows[0].code_hash ?? ""),
          expiresAt: new Date(result.rows[0].expires_at),
          usedAt: result.rows[0].used_at ? new Date(result.rows[0].used_at) : null,
        };
      }
    } catch (error) {
      console.error("Failed to load password reset token", error);
    }
  }

  if (!isOpen(record, now) || !record) {
    return null;
  }

  await markUsed(client, record, now);
  return record.userId;
}

export async function consumePasswordResetCode(client: Pool | null, userId: string, code: string) {
  const hash = tokenHash(code.trim());
  const now = new Date();
  let record = memoryResets.find((item) => item.userId === userId && item.codeHash === hash && !item.usedAt) ?? null;

  if (client) {
    try {
      await ensureResetTable(client);
      const result = await client.query(
        `
        SELECT * FROM password_reset_tokens
        WHERE user_id = $1 AND code_hash = $2 AND used_at IS NULL
        ORDER BY expires_at DESC
        LIMIT 1
        `,
        [userId, hash],
      );
      if (result.rows[0]) {
        record = {
          id: String(result.rows[0].id),
          userId: String(result.rows[0].user_id),
          tokenHash: String(result.rows[0].token_hash),
          codeHash: String(result.rows[0].code_hash ?? ""),
          expiresAt: new Date(result.rows[0].expires_at),
          usedAt: result.rows[0].used_at ? new Date(result.rows[0].used_at) : null,
        };
      }
    } catch (error) {
      console.error("Failed to load password reset code", error);
    }
  }

  if (!isOpen(record, now) || !record) {
    return null;
  }

  await markUsed(client, record, now);
  return record.userId;
}

export async function deletePasswordResetsForUser(userId: string) {
  for (let index = memoryResets.length - 1; index >= 0; index -= 1) {
    if (memoryResets[index].userId === userId) {
      memoryResets.splice(index, 1);
    }
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return;
  }

  const { Pool: PgPool } = await import("pg");
  const client = new PgPool({
    connectionString,
    ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false },
  });
  try {
    await ensureResetTable(client);
    await client.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [userId]);
  } catch (error) {
    console.error("Failed to delete password reset tokens", error);
  } finally {
    await client.end().catch(() => undefined);
  }
}
