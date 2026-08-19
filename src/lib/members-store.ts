import { getPool } from "@/lib/db";
import { emailsMatch, normalizeEmail, normalizePhoneDigits, phonesMatch } from "@/lib/identity";
import { TEMPORARY_MEMBER_PASSWORD } from "@/lib/auth-constants";
import { hashPassword, verifyPassword } from "@/lib/password";

export type MemberAccount = {
  id: string;
  name: string;
  email: string;
  phone: string;
  phoneDigits: string;
  passwordHash: string;
  mustChangePassword: boolean;
  createdAt: string;
};

const memoryMembers: MemberAccount[] = [];
let tableReady = false;

async function ensureTable() {
  const client = getPool();
  if (!client || tableReady) {
    return client;
  }

  await client.query(`
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      phone_digits TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await client.query("CREATE UNIQUE INDEX IF NOT EXISTS members_email_unique ON members (lower(email))");
  await client.query("CREATE UNIQUE INDEX IF NOT EXISTS members_phone_unique ON members (phone_digits)");
  tableReady = true;
  return client;
}

function mapRow(row: Record<string, unknown>): MemberAccount {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    phoneDigits: String(row.phone_digits ?? ""),
    passwordHash: String(row.password_hash ?? ""),
    mustChangePassword: Boolean(row.must_change_password),
    createdAt: String(row.created_at ?? ""),
  };
}

export async function findMemberByEmailOrPhone(email: string, phone: string) {
  const client = await ensureTable();
  const normalizedEmail = normalizeEmail(email);
  const phoneDigits = normalizePhoneDigits(phone);

  if (client) {
    const result = await client.query(
      `
      SELECT * FROM members
      WHERE lower(email) = $1
         OR phone_digits = $2
         OR ($2 <> '' AND right(phone_digits, 10) = right($2, 10) AND length($2) >= 10)
      LIMIT 1
      `,
      [normalizedEmail, phoneDigits],
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  return (
    memoryMembers.find(
      (member) => emailsMatch(member.email, email) || phonesMatch(member.phone, phone),
    ) ?? null
  );
}

export async function findMemberByEmail(email: string) {
  return findMemberByEmailOrPhone(email, "");
}

export async function createMemberAccount(input: {
  name: string;
  email: string;
  phone: string;
}) {
  const existing = await findMemberByEmailOrPhone(input.email, input.phone);
  if (existing) {
    return existing;
  }

  const member: MemberAccount = {
    id: `member-${Date.now()}`,
    name: input.name.trim(),
    email: normalizeEmail(input.email),
    phone: input.phone.trim(),
    phoneDigits: normalizePhoneDigits(input.phone),
    passwordHash: hashPassword(TEMPORARY_MEMBER_PASSWORD),
    mustChangePassword: true,
    createdAt: new Date().toISOString(),
  };

  const client = await ensureTable();
  if (client) {
    await client.query(
      `
      INSERT INTO members (
        id, name, email, phone, phone_digits, password_hash, must_change_password, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT DO NOTHING
      `,
      [
        member.id,
        member.name,
        member.email,
        member.phone,
        member.phoneDigits,
        member.passwordHash,
        member.mustChangePassword,
      ],
    );
    return (await findMemberByEmailOrPhone(member.email, member.phone)) ?? member;
  }

  memoryMembers.unshift(member);
  return member;
}

export async function authenticateMember(email: string, password: string) {
  const member = await findMemberByEmail(email);
  if (!member || !verifyPassword(password, member.passwordHash)) {
    return null;
  }

  return member;
}

export async function updateMemberPassword(email: string, password: string) {
  const member = await findMemberByEmail(email);
  if (!member) {
    return null;
  }

  const passwordHash = hashPassword(password);
  const client = await ensureTable();

  if (client) {
    await client.query(
      "UPDATE members SET password_hash = $1, must_change_password = FALSE WHERE lower(email) = $2",
      [passwordHash, normalizeEmail(email)],
    );
  } else {
    member.passwordHash = passwordHash;
    member.mustChangePassword = false;
  }

  return {
    ...member,
    passwordHash,
    mustChangePassword: false,
  };
}
