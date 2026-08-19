import { Pool } from "pg";

import {
  AccessMap,
  AccessOverride,
  AccessProfile,
  AccessRole,
  Capability,
  ROLE_DEFAULTS,
  mergeAccess,
  parseAccessRole,
} from "@/lib/access";
import { AuthUser } from "@/lib/types";

const memoryRoleDefaults: Record<AccessRole, AccessMap> = {
  admin: { ...ROLE_DEFAULTS.admin },
  partner: { ...ROLE_DEFAULTS.partner },
  member: { ...ROLE_DEFAULTS.member },
  contact: { ...ROLE_DEFAULTS.contact },
};
const memoryUserAccess = new Map<string, { role: AccessRole; overrides: AccessOverride }>();

let pool: Pool | null | undefined;
let tableReady = false;

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }
  if (pool === undefined) {
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function ensureTable(client: Pool) {
  if (tableReady) {
    return;
  }

  await client.query(`
    CREATE TABLE IF NOT EXISTS access_role_defaults (
      role TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS access_user_overrides (
      user_id TEXT PRIMARY KEY,
      access_role TEXT NOT NULL,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  tableReady = true;
}

function asMap(value: unknown, fallback: AccessMap): AccessMap {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const next = { ...fallback };
  for (const key of Object.keys(fallback) as Capability[]) {
    if (typeof record[key] === "boolean") {
      next[key] = record[key];
    }
  }
  return next;
}

function asOverride(value: unknown): AccessOverride {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const next: AccessOverride = {};
  for (const [key, item] of Object.entries(record)) {
    if (typeof item === "boolean") {
      next[key as Capability] = item;
    }
  }
  return next;
}

async function loadRoleDefaults(): Promise<Record<AccessRole, AccessMap>> {
  const defaults: Record<AccessRole, AccessMap> = {
    admin: { ...memoryRoleDefaults.admin },
    partner: { ...memoryRoleDefaults.partner },
    member: { ...memoryRoleDefaults.member },
    contact: { ...memoryRoleDefaults.contact },
  };
  const client = getPool();
  if (!client) {
    return defaults;
  }

  try {
    await ensureTable(client);
    const result = await client.query("SELECT role, payload FROM access_role_defaults");
    for (const row of result.rows) {
      const role = parseAccessRole(String(row.role));
      defaults[role] = asMap(row.payload, ROLE_DEFAULTS[role]);
      memoryRoleDefaults[role] = defaults[role];
    }
  } catch (error) {
    console.error("Failed to load access role defaults", error);
  }

  return defaults;
}

export async function getRoleDefaults() {
  return loadRoleDefaults();
}

export async function saveRoleDefaults(role: AccessRole, payload: AccessMap) {
  const next = asMap(payload, ROLE_DEFAULTS[role]);
  if (role === "admin") {
    next.access = true;
    next.dashboard = true;
  }
  memoryRoleDefaults[role] = next;
  const client = getPool();
  if (!client) {
    return next;
  }

  try {
    await ensureTable(client);
    await client.query(
      `
      INSERT INTO access_role_defaults (role, payload, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (role) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
      `,
      [role, JSON.stringify(next)],
    );
  } catch (error) {
    console.error("Failed to save access role defaults", error);
  }

  return next;
}

export async function getUserAccessRecord(userId: string, fallbackRole: AccessRole) {
  const memory = memoryUserAccess.get(userId);
  if (memory) {
    return memory;
  }

  const client = getPool();
  if (!client) {
    return { role: fallbackRole, overrides: {} as AccessOverride };
  }

  try {
    await ensureTable(client);
    const result = await client.query("SELECT access_role, payload FROM access_user_overrides WHERE user_id = $1 LIMIT 1", [
      userId,
    ]);
    const row = result.rows[0] as { access_role?: string; payload?: unknown } | undefined;
    if (!row) {
      return { role: fallbackRole, overrides: {} as AccessOverride };
    }
    const record = { role: parseAccessRole(row.access_role), overrides: asOverride(row.payload) };
    memoryUserAccess.set(userId, record);
    return record;
  } catch (error) {
    console.error("Failed to load user access", error);
    return { role: fallbackRole, overrides: {} as AccessOverride };
  }
}

export async function saveUserAccess(userId: string, role: AccessRole, overrides: AccessOverride) {
  const record = { role, overrides: asOverride(overrides) };
  memoryUserAccess.set(userId, record);
  const client = getPool();
  if (!client) {
    return record;
  }

  try {
    await ensureTable(client);
    await client.query(
      `
      INSERT INTO access_user_overrides (user_id, access_role, payload, updated_at)
      VALUES ($1, $2, $3::jsonb, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        access_role = EXCLUDED.access_role,
        payload = EXCLUDED.payload,
        updated_at = NOW()
      `,
      [userId, role, JSON.stringify(record.overrides)],
    );
  } catch (error) {
    console.error("Failed to save user access", error);
  }

  return record;
}

export async function resolveAccess(user: Pick<AuthUser, "id" | "role" | "affiliateAccess">): Promise<AccessProfile> {
  const roleDefaults = await loadRoleDefaults();
  const record = await getUserAccessRecord(user.id, parseAccessRole(user.role));
  const profile = mergeAccess(record.role, roleDefaults[record.role], record.overrides);
  if (user.affiliateAccess) {
    profile.resolved.partnership = true;
  }
  return profile;
}

export async function resolveAccessById(userId: string, fallbackRole: AccessRole) {
  const roleDefaults = await loadRoleDefaults();
  const record = await getUserAccessRecord(userId, fallbackRole);
  return mergeAccess(record.role, roleDefaults[record.role], record.overrides);
}
