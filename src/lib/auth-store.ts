import { Pool } from "pg";
import { randomBytes } from "node:crypto";

import { parseAffiliatePrograms, serializeAffiliatePrograms, type AffiliateProgramId } from "@/lib/affiliate";
import { normalizePhoneDigits, phonesMatch } from "@/lib/identity";
import { hashPassword, verifyPassword } from "@/lib/password";
import { parseMemberships, serializeMemberships, type Membership } from "@/lib/membership";
import { AccountStatus, AuthUser, DashboardRole } from "@/lib/types";

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

function publicUser(user: AuthUserRecord): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    memberships: user.memberships,
    affiliateAccess: user.affiliateAccess,
    affiliatePrograms: user.affiliatePrograms,
    phone: user.phone,
    phoneCountry: user.phoneCountry,
    company: user.company,
    profileComplete: user.profileComplete,
    paymentVerified: user.paymentVerified,
    passwordSet: user.passwordSet,
    active: user.active,
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
  const role =
    row.role === "admin" || row.role === "partner" || row.role === "member" || row.role === "contact"
      ? row.role
      : "member";
  const privileged = isPrivileged(role);
  const profileComplete = row.profile_complete === true || row.profile_complete === "t" || privileged;
  const paymentVerified = row.payment_verified === true || row.payment_verified === "t" || privileged;
  const passwordSet = row.password_set === true || row.password_set === "t" || privileged;
  const active = row.active_account === false || row.active_account === "f" ? false : true;

  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    email: String(row.email ?? "").toLowerCase(),
    role,
    affiliateAccess: row.affiliate_access === true || row.affiliate_access === "t" || row.affiliate_access === "true",
    affiliatePrograms: parseAffiliatePrograms(row.affiliate_programs),
    memberships: parseMemberships(row.memberships),
    phone: String(row.phone ?? ""),
    phoneCountry: String(row.phone_country ?? "PH"),
    company: String(row.company ?? ""),
    profileComplete,
    paymentVerified,
    passwordSet,
    active,
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
    ALTER TABLE site_users
    ADD COLUMN IF NOT EXISTS affiliate_access BOOLEAN NOT NULL DEFAULT FALSE
  `);
  await client.query(`
    ALTER TABLE site_users
    ADD COLUMN IF NOT EXISTS affiliate_programs TEXT NOT NULL DEFAULT ''
  `);
  await client.query(`
    ALTER TABLE site_users
    ADD COLUMN IF NOT EXISTS active_account BOOLEAN NOT NULL DEFAULT TRUE
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
  } else {
    await updateUserRecord(existing.id, {
      name: existing.name || "Coach Admin",
      email: adminEmail,
      role: "admin",
      passwordHash,
    });
  }

  try {
    const { provisionAdRegistrants } = await import("@/lib/member-access");
    await provisionAdRegistrants();
  } catch (error) {
    console.error("Failed to provision ad registrants", error);
  }
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

export async function findUserByEmailOrPhone(email: string, phone: string) {
  const byEmail = email.trim() ? await findUserByEmail(email) : null;
  if (byEmail) {
    return byEmail;
  }

  const digits = normalizePhoneDigits(phone);
  if (digits.length < 8) {
    return null;
  }

  const client = getPool();
  if (!client) {
    return memoryUsers.find((user) => phonesMatch(user.phone, phone)) ?? null;
  }

  try {
    await ensureTable(client);
    const result = await client.query(
      `
      SELECT * FROM site_users
      WHERE regexp_replace(phone, '[^0-9]', '', 'g') = $1
         OR (
           length($1) >= 10
           AND right(regexp_replace(phone, '[^0-9]', '', 'g'), 10) = right($1, 10)
         )
      LIMIT 1
      `,
      [digits],
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  } catch (error) {
    console.error("Failed to load user by phone", error);
    return memoryUsers.find((user) => phonesMatch(user.phone, phone)) ?? null;
  }
}

export async function issueTemporaryPassword(userId: string) {
  const { TEMPORARY_MEMBER_PASSWORD } = await import("@/lib/auth-constants");
  const passwordHash = await hashPassword(TEMPORARY_MEMBER_PASSWORD);
  const memoryIndex = memoryUsers.findIndex((user) => user.id === userId);
  if (memoryIndex >= 0) {
    memoryUsers[memoryIndex] = {
      ...memoryUsers[memoryIndex],
      passwordHash,
      passwordSet: false,
    };
  }

  const client = getPool();
  if (!client) {
    return;
  }

  try {
    await ensureTable(client);
    await client.query(
      "UPDATE site_users SET password_hash = $2, password_set = FALSE WHERE id = $1",
      [userId, passwordHash],
    );
  } catch (error) {
    console.error("Failed to issue temporary password", error);
  }
}

export async function setUserPassword(userId: string, password: string) {
  await updateUserPasswordHash(userId, await hashPassword(password));
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
  const existing = await findUserByEmailOrPhone(email, input.phone ?? "");

  if (existing) {
    throw new Error("An account with this email or phone already exists.");
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
    affiliateAccess: false,
    affiliatePrograms: [],
    memberships: parseMemberships(input.memberships ?? []),
    phone: input.phone ?? "",
    phoneCountry: input.phoneCountry ?? "PH",
    company: input.company ?? "",
    profileComplete,
    paymentVerified,
    passwordSet,
    active: true,
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
          phone, phone_country, company, profile_complete, payment_verified, password_set,
          affiliate_access, affiliate_programs, active_account
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
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
          user.affiliateAccess,
          serializeAffiliatePrograms(user.affiliatePrograms),
          user.active,
        ],
      );
    } catch (error) {
      console.error("Failed to persist user", error);
      const memoryIndex = memoryUsers.findIndex((item) => item.id === user.id);
      if (memoryIndex >= 0) {
        memoryUsers.splice(memoryIndex, 1);
      }
      throw new Error("I couldn't create this account just now. Please try again.");
    }
  }

  return publicUser(user);
}

export async function ensurePortalUserForContact(input: {
  name: string;
  email: string;
  phone?: string;
  phoneCountry?: string;
  company?: string;
  bestDescribesYou?: string;
  dateOfBirth?: string;
  address?: string;
  facebookPhotoUrl?: string;
}) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!email || !name) {
    return null;
  }

  await ensureSeedUsers();
  const existing = await findUserByEmail(email);
  if (existing) {
    return publicUser(existing);
  }

  const user: AuthUserRecord = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    email,
    role: "contact",
    affiliateAccess: false,
    affiliatePrograms: [],
    memberships: [],
    phone: input.phone ?? "",
    phoneCountry: input.phoneCountry ?? "PH",
    company: input.company ?? "",
    profileComplete: true,
    paymentVerified: true,
    passwordSet: false,
    active: true,
    accountStatus: "verified",
    bestDescribesYou: input.bestDescribesYou ?? "",
    dateOfBirth: input.dateOfBirth ?? "",
    address: input.address ?? "",
    facebookProfileUrl: "",
    facebookPhotoUrl: input.facebookPhotoUrl ?? "",
    passwordHash: `pending:${randomBytes(16).toString("hex")}`,
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
          phone, phone_country, company, profile_complete, payment_verified, password_set,
          affiliate_access, affiliate_programs
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        ON CONFLICT (email) DO NOTHING
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
          user.affiliateAccess,
          serializeAffiliatePrograms(user.affiliatePrograms),
        ],
      );
    } catch (error) {
      console.error("Failed to provision contact portal", error);
    }
  }

  const saved = await findUserByEmail(email);
  return saved ? publicUser(saved) : publicUser(user);
}

export async function getPublicUserById(id: string) {
  await ensureSeedUsers();
  const user = await findUserById(id);
  return user ? publicUser(user) : null;
}

export async function authenticateUser(email: string, password: string) {
  await ensureSeedUsers();
  const user = await findUserByEmail(email);

  if (!user) {
    return null;
  }

  if (await verifyPassword(password, user.passwordHash)) {
    return publicUser(user);
  }

  return null;
}

export async function completeMemberProfile(
  userId: string,
  input: {
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

  const next: AuthUserRecord = {
    ...user,
    memberships: parseMemberships(input.memberships),
    bestDescribesYou: input.bestDescribesYou,
    dateOfBirth: input.dateOfBirth,
    address: input.address,
    facebookProfileUrl: input.facebookProfileUrl ?? "",
    facebookPhotoUrl: input.facebookPhotoUrl ?? "",
    profileComplete: true,
    accountStatus: deriveStatus({
      role: user.role,
      profileComplete: true,
      paymentVerified: user.paymentVerified,
    }),
  };

  await persistUserUpdate(next);
  return publicUser(next);
}

export async function updateOwnAccount(
  userId: string,
  input: {
    name: string;
    phone: string;
    phoneCountry: string;
    company: string;
    memberships: Membership[];
    bestDescribesYou: string;
    dateOfBirth: string;
    address: string;
    facebookProfileUrl?: string;
    facebookPhotoUrl?: string;
    currentPassword?: string;
    newPassword?: string;
  },
) {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("Account not found.");
  }

  if (input.newPassword) {
    if (!input.currentPassword || !(await verifyPassword(input.currentPassword, user.passwordHash))) {
      throw new Error("Current password is incorrect.");
    }
  }

  const next: AuthUserRecord = {
    ...user,
    name: input.name.trim(),
    phone: input.phone,
    phoneCountry: input.phoneCountry,
    company: input.company.trim(),
    memberships: parseMemberships(input.memberships),
    bestDescribesYou: input.bestDescribesYou,
    dateOfBirth: input.dateOfBirth,
    address: input.address,
    facebookProfileUrl: input.facebookProfileUrl ?? "",
    facebookPhotoUrl: input.facebookPhotoUrl ?? user.facebookPhotoUrl,
    profileComplete: true,
    passwordHash: input.newPassword ? await hashPassword(input.newPassword) : user.passwordHash,
    passwordSet: true,
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

export async function setUserActive(userId: string, active: boolean) {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("Account not found.");
  }

  const next: AuthUserRecord = { ...user, active };
  await persistUserUpdate(next);
  return publicUser(next);
}

export async function setUserAvatar(userId: string, photoUrl: string) {
  const memoryIndex = memoryUsers.findIndex((user) => user.id === userId);
  if (memoryIndex >= 0) {
    memoryUsers[memoryIndex] = { ...memoryUsers[memoryIndex], facebookPhotoUrl: photoUrl };
  }

  const client = getPool();
  if (!client) {
    const user = memoryUsers.find((item) => item.id === userId);
    return user ? publicUser(user) : null;
  }

  try {
    await ensureTable(client);
    await client.query("UPDATE site_users SET facebook_photo_url = $2 WHERE id = $1", [userId, photoUrl]);
    return getPublicUserById(userId);
  } catch (error) {
    console.error("Failed to update user avatar", error);
    const user = memoryUsers.find((item) => item.id === userId);
    return user ? publicUser(user) : null;
  }
}

export async function approveAllMemberRegistrations() {
  const members = await listMemberRegistrations();
  const pending = members.filter(
    (user) => (user.role === "member" || user.role === "contact") && !user.paymentVerified,
  );

  let paymentVerified = 0;
  let accountsVerified = 0;

  for (const user of pending) {
    const next = await setMemberPaymentVerified(user.id, true);
    paymentVerified += 1;
    if (next.accountStatus === "verified") {
      accountsVerified += 1;
    }
  }

  return {
    pendingFound: pending.length,
    paymentVerified,
    accountsVerified,
    stillPendingProfile: paymentVerified - accountsVerified,
  };
}

export async function listMemberRegistrations() {
  await ensureSeedUsers();
  const client = getPool();

  if (!client) {
    return memoryUsers.filter((user) => user.role === "member" || user.role === "contact").map(publicUser);
  }

  try {
    await ensureTable(client);
    const result = await client.query(
      "SELECT * FROM site_users WHERE role IN ('member', 'contact') ORDER BY created_at DESC",
    );
    return result.rows.map((row) => publicUser(mapRow(row)));
  } catch (error) {
    console.error("Failed to list member registrations", error);
    return memoryUsers.filter((user) => user.role === "member" || user.role === "contact").map(publicUser);
  }
}

export async function listAllUsers() {
  await ensureSeedUsers();
  const client = getPool();

  if (!client) {
    return memoryUsers.map(publicUser);
  }

  try {
    await ensureTable(client);
    const result = await client.query("SELECT * FROM site_users ORDER BY role ASC, name ASC");
    return result.rows.map((row) => publicUser(mapRow(row)));
  } catch (error) {
    console.error("Failed to list users", error);
    return memoryUsers.map(publicUser);
  }
}

export async function updateUserRole(userId: string, role: DashboardRole) {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("Account not found.");
  }

  const next: AuthUserRecord = {
    ...user,
    role,
    accountStatus: deriveStatus({
      role,
      profileComplete: user.profileComplete,
      paymentVerified: user.paymentVerified,
    }),
  };
  await persistUserUpdate(next);
  return publicUser(next);
}

export async function deleteUser(userId: string) {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("Account not found.");
  }

  if (user.role === "admin") {
    const admins = (await listAllUsers()).filter((item) => item.role === "admin");
    if (admins.length <= 1) {
      throw new Error("Keep at least one admin account.");
    }
  }

  const memoryIndex = memoryUsers.findIndex((item) => item.id === userId);
  if (memoryIndex >= 0) {
    memoryUsers.splice(memoryIndex, 1);
  }

  const client = getPool();
  if (client) {
    try {
      await ensureTable(client);
      await client.query("DELETE FROM site_users WHERE id = $1", [userId]);
    } catch (error) {
      console.error("Failed to delete user", error);
      throw new Error("I couldn't delete this account just now.");
    }
  }

  return publicUser(user);
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
        password_set = $17,
        active_account = $18
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
        user.active,
      ],
    );
  } catch (error) {
    console.error("Failed to update user", error);
  }
}

export async function requestPasswordReset(identifier: string) {
  await ensureSeedUsers();
  const raw = identifier.trim();
  const looksLikeEmail = raw.includes("@");
  const user = looksLikeEmail
    ? await findUserByEmail(raw)
    : await findUserByEmailOrPhone("", raw);

  if (!user) {
    await hashPassword(`${raw}:missing`);
    return;
  }

  const { createPasswordResetToken } = await import("@/lib/password-reset");
  const { notifyPasswordReset } = await import("@/lib/activity-notify");
  const { siteUrl } = await import("@/lib/site");
  const { token, code } = await createPasswordResetToken(getPool(), user.id);
  await notifyPasswordReset({
    name: user.name,
    email: user.email,
    phone: user.phone,
    code,
    resetUrl: `${siteUrl}/reset-password?token=${encodeURIComponent(token)}`,
  });
}

export async function resetPasswordWithToken(token: string, password: string) {
  const { consumePasswordResetToken } = await import("@/lib/password-reset");
  const userId = await consumePasswordResetToken(getPool(), token);

  if (!userId) {
    return false;
  }

  await updateUserPasswordHash(userId, await hashPassword(password));
  return true;
}

export async function resetPasswordWithCode(identifier: string, code: string, password: string) {
  await ensureSeedUsers();
  const raw = identifier.trim();
  const looksLikeEmail = raw.includes("@");
  const user = looksLikeEmail
    ? await findUserByEmail(raw)
    : await findUserByEmailOrPhone("", raw);

  if (!user) {
    return false;
  }

  const { consumePasswordResetCode } = await import("@/lib/password-reset");
  const userId = await consumePasswordResetCode(getPool(), user.id, code.replace(/\D/g, ""));
  if (!userId) {
    return false;
  }

  await updateUserPasswordHash(userId, await hashPassword(password));
  return true;
}

export async function listPublicUsers() {
  await ensureSeedUsers();
  const client = getPool();

  if (!client) {
    return memoryUsers.map(publicUser);
  }

  try {
    await ensureTable(client);
    const result = await client.query("SELECT * FROM site_users ORDER BY created_at DESC");
    return result.rows.map((row) => publicUser(mapRow(row)));
  } catch (error) {
    console.error("Failed to list users", error);
    return memoryUsers.map(publicUser);
  }
}

export async function setAffiliatePrograms(id: string, programs: AffiliateProgramId[]) {
  const next = parseAffiliatePrograms(programs);
  const affiliateAccess = next.length > 0;
  const memoryIndex = memoryUsers.findIndex((user) => user.id === id);
  if (memoryIndex >= 0) {
    memoryUsers[memoryIndex] = {
      ...memoryUsers[memoryIndex],
      affiliatePrograms: next,
      affiliateAccess,
    };
  }

  const client = getPool();
  if (!client) {
    const user = memoryUsers.find((item) => item.id === id);
    return user ? publicUser(user) : null;
  }

  try {
    await ensureTable(client);
    await client.query(
      "UPDATE site_users SET affiliate_programs = $2, affiliate_access = $3 WHERE id = $1",
      [id, serializeAffiliatePrograms(next), affiliateAccess],
    );
    return getPublicUserById(id);
  } catch (error) {
    console.error("Failed to update affiliate programs", error);
    const user = memoryUsers.find((item) => item.id === id);
    return user ? publicUser(user) : null;
  }
}

export async function setAffiliateAccess(id: string, affiliateAccess: boolean) {
  const memoryIndex = memoryUsers.findIndex((user) => user.id === id);
  if (memoryIndex >= 0) {
    memoryUsers[memoryIndex] = {
      ...memoryUsers[memoryIndex],
      affiliateAccess,
    };
  }

  const client = getPool();
  if (!client) {
    const user = memoryUsers.find((item) => item.id === id);
    return user ? publicUser(user) : null;
  }

  try {
    await ensureTable(client);
    await client.query("UPDATE site_users SET affiliate_access = $2 WHERE id = $1", [id, affiliateAccess]);
    return getPublicUserById(id);
  } catch (error) {
    console.error("Failed to update affiliate access", error);
    const user = memoryUsers.find((item) => item.id === id);
    return user ? publicUser(user) : null;
  }
}

async function updateUserPasswordHash(id: string, passwordHash: string) {
  const memoryIndex = memoryUsers.findIndex((user) => user.id === id);
  if (memoryIndex >= 0) {
    memoryUsers[memoryIndex] = {
      ...memoryUsers[memoryIndex],
      passwordHash,
      passwordSet: true,
    };
  }

  const client = getPool();
  if (!client) {
    return;
  }

  try {
    await ensureTable(client);
    await client.query(
      "UPDATE site_users SET password_hash = $2, password_set = TRUE WHERE id = $1",
      [id, passwordHash],
    );
  } catch (error) {
    console.error("Failed to update password", error);
  }
}
