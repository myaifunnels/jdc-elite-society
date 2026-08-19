import { Pool } from "pg";

import { hashPassword } from "@/lib/password";
import { parseMemberships, serializeMemberships, type Membership } from "@/lib/membership";
import { AccountStatus, AuthUser, DashboardRole } from "@/lib/types";
import { normalizePhone } from "@/lib/countries";

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

function isPrivileged(role: DashboardRole) {
  return role === "admin" || role === "partner";
}

function deriveStatus(input: {
  role: DashboardRole;
  profileComplete: boolean;
  paymentVerified: boolean;
}): AccountStatus {
  if (isPrivileged(input.role) || (input.profileComplete && input.paymentVerified)) {
    return "verified";
  }

  return "pending";
}

function phonesMatch(input: string, stored: string) {
  const entered = normalizePhone(input);
  const saved = normalizePhone(stored);

  if (!entered || !saved) {
    return false;
  }

  if (entered === saved) {
    return true;
  }

  return entered.length >= 8 && (saved.endsWith(entered) || entered.endsWith(saved));
}

function publicUser(user: AuthUserRecord): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    memberships: user.memberships,
    phone: user.phone,
    phoneCountry: user.phoneCountry,
    company: user.company,
    profileComplete: user.profileComplete,
    paymentVerified: user.paymentVerified,
    passwordSet: user.passwordSet,
    accountStatus: deriveStatus(user),
    bestDescribesYou: user.bestDescribesYou,
    dateOfBirth: user.dateOfBirth,
    address: user.address,
    facebookProfileUrl: user.facebookProfileUrl,
    facebookPhotoUrl: user.facebookPhotoUrl,
    createdAt: user.createdAt,
  };
}

function mapRow(row: Record<string, unknown>): AuthUserRecord {
  const role = row.role === "admin" || row.role === "partner" || row.role === "member" ? row.role : "member";
  const privileged = isPrivileged(role);
  const profileComplete = row.profile_complete === true || row.profile_complete === "t" || privileged;
  const paymentVerified = row.payment_verified === true || row.payment_verified === "t" || privileged;
  const passwordSet = row.password_set === true || row.password_set === "t" || privileged;

  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    email: String(row.email ?? "").toLowerCase(),
    role,
    memberships: parseMemberships(row.memberships),
    phone: String(row.phone ?? ""),
    phoneCountry: String(row.phone_country ?? "PH"),
    company: String(row.company ?? ""),
    profileComplete,
    paymentVerified,
    passwordSet,
    accountStatus: deriveStatus({ role, profileComplete, paymentVerified }),
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
  await client.query(`
    ALTER TABLE site_users
    ADD COLUMN IF NOT EXISTS memberships TEXT NOT NULL DEFAULT ''
  `);
  await client.query(`
    ALTER TABLE site_users
    ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT ''
  `);
  await client.query(`
    ALTER TABLE site_users
    ADD COLUMN IF NOT EXISTS phone_country TEXT NOT NULL DEFAULT 'PH'
  `);
  await client.query(`
    ALTER TABLE site_users
    ADD COLUMN IF NOT EXISTS company TEXT NOT NULL DEFAULT ''
  `);
  await client.query(`
    ALTER TABLE site_users
    ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN NOT NULL DEFAULT FALSE
  `);
  await client.query(`
    ALTER TABLE site_users
    ADD COLUMN IF NOT EXISTS payment_verified BOOLEAN NOT NULL DEFAULT FALSE
  `);
  await client.query(`
    ALTER TABLE site_users
    ADD COLUMN IF NOT EXISTS password_set BOOLEAN NOT NULL DEFAULT FALSE
  `);
  await client.query(`
    UPDATE site_users
    SET profile_complete = TRUE, payment_verified = TRUE, password_set = TRUE
    WHERE role IN ('admin', 'partner')
  `);
  await client.query(`
    UPDATE site_users
    SET profile_complete = TRUE, payment_verified = TRUE, password_set = TRUE
    WHERE role = 'member'
      AND COALESCE(date_of_birth, '') <> ''
      AND COALESCE(address, '') <> ''
  `);
  tableReady = true;
}

const LEGACY_ADMIN_EMAILS = ["admin@coachjdc.org"];

export async function ensureSeedUsers() {
  if (seedReady) {
    return;
  }

  seedReady = true;

  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@gmail.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin";
  const passwordHash = await hashPassword(adminPassword);

  let existing = await findUserByEmail(adminEmail);

  if (!existing) {
    for (const legacyEmail of LEGACY_ADMIN_EMAILS) {
      existing = await findUserByEmail(legacyEmail);
      if (existing) {
        break;
      }
    }
  }

  if (!existing) {
    existing = await findAdminUser();
  }

  if (!existing) {
    await createUser({
      name: "Coach Admin",
      email: adminEmail,
      password: adminPassword,
      role: "admin",
    });
    return;
  }

  await updateUserRecord(existing.id, {
    name: existing.name || "Coach Admin",
    email: adminEmail,
    role: "admin",
    passwordHash,
  });
}

async function findAdminUser() {
  const client = getPool();

  if (!client) {
    return memoryUsers.find((user) => user.role === "admin") ?? null;
  }

  try {
    await ensureTable(client);
    const result = await client.query(
      "SELECT * FROM site_users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1",
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  } catch (error) {
    console.error("Failed to load admin user", error);
    return memoryUsers.find((user) => user.role === "admin") ?? null;
  }
}

async function updateUserRecord(
  id: string,
  input: { name: string; email: string; role: DashboardRole; passwordHash: string },
) {
  const memoryIndex = memoryUsers.findIndex((user) => user.id === id);
  if (memoryIndex >= 0) {
    memoryUsers[memoryIndex] = {
      ...memoryUsers[memoryIndex],
      ...input,
    };
  }

  const client = getPool();
  if (!client) {
    return;
  }

  try {
    await ensureTable(client);
    await client.query(
      `
      UPDATE site_users
      SET name = $2, email = $3, role = $4, password_hash = $5
      WHERE id = $1
      `,
      [id, input.name, input.email, input.role, input.passwordHash],
    );
  } catch (error) {
    console.error("Failed to update admin user", error);
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
  phone?: string;
  phoneCountry?: string;
  company?: string;
  bestDescribesYou?: string;
  dateOfBirth?: string;
  address?: string;
  facebookProfileUrl?: string;
  facebookPhotoUrl?: string;
  memberships?: Membership[];
  profileComplete?: boolean;
  paymentVerified?: boolean;
  passwordSet?: boolean;
}) {
  const email = input.email.trim().toLowerCase();
  const existing = await findUserByEmail(email);

  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const privileged = isPrivileged(input.role);
  const profileComplete = input.profileComplete ?? privileged;
  const paymentVerified = input.paymentVerified ?? privileged;
  const passwordSet = input.passwordSet ?? privileged;
  const user: AuthUserRecord = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name.trim(),
    email,
    role: input.role,
    memberships: parseMemberships(input.memberships ?? []),
    phone: input.phone ?? "",
    phoneCountry: input.phoneCountry ?? "PH",
    company: input.company ?? "",
    profileComplete,
    paymentVerified,
    passwordSet,
    accountStatus: deriveStatus({ role: input.role, profileComplete, paymentVerified }),
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
          date_of_birth, address, facebook_profile_url, facebook_photo_url, memberships,
          phone, phone_country, company, profile_complete, payment_verified, password_set
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
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
          serializeMemberships(user.memberships),
          user.phone,
          user.phoneCountry,
          user.company,
          user.profileComplete,
          user.paymentVerified,
          user.passwordSet,
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

  if (await verifyPassword(password, user.passwordHash)) {
    return publicUser(user);
  }

  if (!user.passwordSet && phonesMatch(password, user.phone)) {
    return publicUser(user);
  }

  return null;
}

export async function completeMemberProfile(
  userId: string,
  input: {
    password: string;
    memberships: Membership[];
    bestDescribesYou: string;
    dateOfBirth: string;
    address: string;
    facebookProfileUrl?: string;
    facebookPhotoUrl?: string;
  },
) {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("Account not found.");
  }

  const passwordHash = await hashPassword(input.password);
  const next: AuthUserRecord = {
    ...user,
    memberships: parseMemberships(input.memberships),
    bestDescribesYou: input.bestDescribesYou,
    dateOfBirth: input.dateOfBirth,
    address: input.address,
    facebookProfileUrl: input.facebookProfileUrl ?? "",
    facebookPhotoUrl: input.facebookPhotoUrl ?? "",
    profileComplete: true,
    passwordSet: true,
    passwordHash,
    accountStatus: deriveStatus({
      role: user.role,
      profileComplete: true,
      paymentVerified: user.paymentVerified,
    }),
  };

  await persistUserUpdate(next);
  return publicUser(next);
}

export async function setMemberPaymentVerified(userId: string, verified = true) {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("Account not found.");
  }

  const next: AuthUserRecord = {
    ...user,
    paymentVerified: verified,
    accountStatus: deriveStatus({
      role: user.role,
      profileComplete: user.profileComplete,
      paymentVerified: verified,
    }),
  };

  await persistUserUpdate(next);
  return publicUser(next);
}

export async function listMemberRegistrations() {
  await ensureSeedUsers();
  const client = getPool();

  if (!client) {
    return memoryUsers.filter((user) => user.role === "member").map(publicUser);
  }

  try {
    await ensureTable(client);
    const result = await client.query(
      "SELECT * FROM site_users WHERE role = 'member' ORDER BY created_at DESC",
    );
    return result.rows.map((row) => publicUser(mapRow(row)));
  } catch (error) {
    console.error("Failed to list member registrations", error);
    return memoryUsers.filter((user) => user.role === "member").map(publicUser);
  }
}

async function persistUserUpdate(user: AuthUserRecord) {
  const memoryIndex = memoryUsers.findIndex((item) => item.id === user.id);
  if (memoryIndex >= 0) {
    memoryUsers[memoryIndex] = user;
  } else {
    memoryUsers.unshift(user);
  }

  const client = getPool();
  if (!client) {
    return;
  }

  try {
    await ensureTable(client);
    await client.query(
      `
      UPDATE site_users SET
        name = $2,
        email = $3,
        role = $4,
        password_hash = $5,
        best_describes_you = $6,
        date_of_birth = $7,
        address = $8,
        facebook_profile_url = $9,
        facebook_photo_url = $10,
        memberships = $11,
        phone = $12,
        phone_country = $13,
        company = $14,
        profile_complete = $15,
        payment_verified = $16,
        password_set = $17
      WHERE id = $1
      `,
      [
        user.id,
        user.name,
        user.email,
        user.role,
        user.passwordHash,
        user.bestDescribesYou,
        user.dateOfBirth,
        user.address,
        user.facebookProfileUrl,
        user.facebookPhotoUrl,
        serializeMemberships(user.memberships),
        user.phone,
        user.phoneCountry,
        user.company,
        user.profileComplete,
        user.paymentVerified,
        user.passwordSet,
      ],
    );
  } catch (error) {
    console.error("Failed to update user", error);
  }
}
