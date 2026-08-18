import { Pool } from "pg";

import { hashPassword } from "@/lib/password";
import { AuthUser, DashboardRole } from "@/lib/types";

export type AuthUserRecord = AuthUser & {
  passwordHash: string;
};

const memoryUsers: AuthUserRecord[] = [];
let seedReady = false;

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
      ssl: connectionString.includes("localhost")
        ? undefined
        : { rejectUnauthorized: false },
    });
  }

  return pool;
}

function publicUser(user: AuthUserRecord): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    bestDescribesYou: user.bestDescribesYou,
    dateOfBirth: user.dateOfBirth,
    address: user.address,
    facebookProfileUrl: user.facebookProfileUrl,
    facebookPhotoUrl: user.facebookPhotoUrl,
    createdAt: user.createdAt,
  };
}

function mapRow(row: Record<string, unknown>): AuthUserRecord {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    email: String(row.email ?? "").toLowerCase(),
    role: row.role === "admin" || row.role === "partner" || row.role === "member" ? row.role : "member",
    bestDescribesYou: String(row.best_describes_you ?? ""),
    dateOfBirth: String(row.date_of_birth ?? ""),
    address: String(row.address ?? ""),
    facebookProfileUrl: String(row.facebook_profile_url ?? ""),
    facebookPhotoUrl: String(row.facebook_photo_url ?? ""),
    passwordHash: String(row.password_hash ?? ""),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

async function ensureTable(client: Pool) {
  if (tableReady) {
    return;
  }

  await client.query(`
    CREATE TABLE IF NOT EXISTS site_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await client.query(`
    ALTER TABLE site_users
    ADD COLUMN IF NOT EXISTS best_describes_you TEXT NOT NULL DEFAULT ''
  `);
  await client.query(`
    ALTER TABLE site_users
    ADD COLUMN IF NOT EXISTS date_of_birth TEXT NOT NULL DEFAULT ''
  `);
  await client.query(`
    ALTER TABLE site_users
    ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT ''
  `);
  await client.query(`
    ALTER TABLE site_users
    ADD COLUMN IF NOT EXISTS facebook_profile_url TEXT NOT NULL DEFAULT ''
  `);
  await client.query(`
    ALTER TABLE site_users
    ADD COLUMN IF NOT EXISTS facebook_photo_url TEXT NOT NULL DEFAULT ''
  `);
  tableReady = true;
}

export async function ensureSeedUsers() {
  if (seedReady) {
    return;
  }

  seedReady = true;

  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@coachjdc.org").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin";
  const existing = await findUserByEmail(adminEmail);

  if (!existing) {
    await createUser({
      name: "Coach Admin",
      email: adminEmail,
      password: adminPassword,
      role: "admin",
    });
  }
}

export async function findUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const client = getPool();

  if (!client) {
    return memoryUsers.find((user) => user.email === normalized) ?? null;
  }

  try {
    await ensureTable(client);
    const result = await client.query("SELECT * FROM site_users WHERE email = $1 LIMIT 1", [normalized]);
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  } catch (error) {
    console.error("Failed to load user by email", error);
    return memoryUsers.find((user) => user.email === normalized) ?? null;
  }
}

export async function findUserById(id: string) {
  const client = getPool();

  if (!client) {
    return memoryUsers.find((user) => user.id === id) ?? null;
  }

  try {
    await ensureTable(client);
    const result = await client.query("SELECT * FROM site_users WHERE id = $1 LIMIT 1", [id]);
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  } catch (error) {
    console.error("Failed to load user by id", error);
    return memoryUsers.find((user) => user.id === id) ?? null;
  }
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: Exclude<DashboardRole, "admin"> | "admin";
  bestDescribesYou?: string;
  dateOfBirth?: string;
  address?: string;
  facebookProfileUrl?: string;
  facebookPhotoUrl?: string;
}) {
  const email = input.email.trim().toLowerCase();
  const existing = await findUserByEmail(email);

  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const user: AuthUserRecord = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name.trim(),
    email,
    role: input.role,
    bestDescribesYou: input.bestDescribesYou ?? "",
    dateOfBirth: input.dateOfBirth ?? "",
    address: input.address ?? "",
    facebookProfileUrl: input.facebookProfileUrl ?? "",
    facebookPhotoUrl: input.facebookPhotoUrl ?? "",
    passwordHash: await hashPassword(input.password),
    createdAt: new Date().toISOString(),
  };

  memoryUsers.unshift(user);

  const client = getPool();
  if (client) {
    try {
      await ensureTable(client);
      await client.query(
        `
        INSERT INTO site_users (
          id, name, email, role, password_hash, created_at, best_describes_you,
          date_of_birth, address, facebook_profile_url, facebook_photo_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `,
        [
          user.id,
          user.name,
          user.email,
          user.role,
          user.passwordHash,
          user.createdAt,
          user.bestDescribesYou,
          user.dateOfBirth,
          user.address,
          user.facebookProfileUrl,
          user.facebookPhotoUrl,
        ],
      );
    } catch (error) {
      console.error("Failed to persist user", error);
    }
  }

  return publicUser(user);
}

export async function getPublicUserById(id: string) {
  await ensureSeedUsers();
  const user = await findUserById(id);
  return user ? publicUser(user) : null;
}

export async function authenticateUser(email: string, password: string) {
  await ensureSeedUsers();
  const { verifyPassword } = await import("@/lib/password");
  const user = await findUserByEmail(email);

  if (!user) {
    return null;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  return valid ? publicUser(user) : null;
}
