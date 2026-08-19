import { createHash, randomBytes } from "node:crypto";

import { Pool } from "pg";

type ResetRecord = {
  id: string;
  userId: string;
  tokenHash: string;
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
  resetTableReady = true;
}

export async function createPasswordResetToken(
  client: Pool | null,
  userId: string,
) {
  const token = randomBytes(32).toString("hex");
  const record: ResetRecord = {
    id: `reset-${Date.now()}-${randomBytes(4).toString("hex")}`,
    userId,
    tokenHash: tokenHash(token),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    usedAt: null,
  };

  memoryResets.unshift(record);

  if (client) {
    try {
      await ensureResetTable(client);
      await client.query(
        `
        INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, used_at)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [record.id, record.userId, record.tokenHash, record.expiresAt.toISOString(), null],
      );
    } catch (error) {
      console.error("Failed to persist password reset token", error);
    }
  }

  return token;
}

export async function consumePasswordResetToken(client: Pool | null, token: string) {
  const hash = tokenHash(token);
  const now = new Date();

  let record = memoryResets.find((item) => item.tokenHash === hash && !item.usedAt) ?? null;

  if (client) {
    try {
      await ensureResetTable(client);
      const result = await client.query(
        `
        SELECT * FROM password_reset_tokens
        WHERE token_hash = $1 AND used_at IS NULL
        LIMIT 1
        `,
        [hash],
      );
      if (result.rows[0]) {
        record = {
          id: String(result.rows[0].id),
          userId: String(result.rows[0].user_id),
          tokenHash: String(result.rows[0].token_hash),
          expiresAt: new Date(result.rows[0].expires_at),
          usedAt: result.rows[0].used_at ? new Date(result.rows[0].used_at) : null,
        };
      }
    } catch (error) {
      console.error("Failed to load password reset token", error);
    }
  }

  if (!record || record.usedAt || record.expiresAt.getTime() < now.getTime()) {
    return null;
  }

  record.usedAt = now;

  if (client) {
    try {
      await ensureResetTable(client);
      await client.query("UPDATE password_reset_tokens SET used_at = $2 WHERE id = $1", [
        record.id,
        now.toISOString(),
      ]);
    } catch (error) {
      console.error("Failed to consume password reset token", error);
    }
  }

  return record.userId;
}
