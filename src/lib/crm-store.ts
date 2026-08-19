import { leadSeed } from "@/data/crm";
import { getPool } from "@/lib/db";
import { emailsMatch, normalizeEmail, normalizePhoneDigits, phonesMatch } from "@/lib/identity";
import { LeadRecord } from "@/lib/types";

const records = [...leadSeed];
let tableReady = false;

async function ensureTable() {
  const client = getPool();
  if (!client || tableReady) {
    return client;
  }

  await client.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      phone_digits TEXT NOT NULL,
      date_of_birth TEXT,
      address TEXT,
      city TEXT,
      tags TEXT[],
      best_describes_you TEXT,
      program_interest TEXT,
      status TEXT,
      source TEXT,
      assigned_partner TEXT,
      created_at TEXT
    )
  `);
  await client.query("CREATE UNIQUE INDEX IF NOT EXISTS leads_email_unique ON leads (lower(email))");
  await client.query("CREATE UNIQUE INDEX IF NOT EXISTS leads_phone_unique ON leads (phone_digits)");
  tableReady = true;
  return client;
}

function mapRow(row: Record<string, unknown>): LeadRecord {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    dateOfBirth: String(row.date_of_birth ?? ""),
    address: String(row.address ?? ""),
    city: String(row.city ?? ""),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    bestDescribesYou: String(row.best_describes_you ?? ""),
    programInterest: String(row.program_interest ?? ""),
    status: (String(row.status ?? "new") as LeadRecord["status"]),
    source: String(row.source ?? "Website form"),
    assignedPartner: row.assigned_partner ? String(row.assigned_partner) : undefined,
    createdAt: String(row.created_at ?? ""),
  };
}

export async function listLeads(role: "admin" | "partner") {
  const client = await ensureTable();
  let leads = records;

  if (client) {
    const result = await client.query("SELECT * FROM leads ORDER BY created_at DESC");
    leads = result.rows.length ? result.rows.map(mapRow) : records;
  }

  if (role === "admin") {
    return leads;
  }

  return leads.filter((lead) => lead.assignedPartner === "Rico Dela Pena");
}

export async function findLeadByEmailOrPhone(email: string, phone: string) {
  const client = await ensureTable();
  const normalizedEmail = normalizeEmail(email);
  const phoneDigits = normalizePhoneDigits(phone);

  if (client) {
    const result = await client.query(
      `
      SELECT * FROM leads
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
    records.find((lead) => emailsMatch(lead.email, email) || phonesMatch(lead.phone, phone)) ?? null
  );
}

export async function createLead(
  payload: Omit<LeadRecord, "id" | "createdAt" | "status" | "source"> & {
    source?: string;
  },
) {
  const lead: LeadRecord = {
    id: `lead-${Date.now()}`,
    createdAt: new Date().toISOString().slice(0, 10),
    status: "new",
    source: payload.source ?? "Website form",
    ...payload,
    email: normalizeEmail(payload.email),
  };

  const client = await ensureTable();
  if (client) {
    await client.query(
      `
      INSERT INTO leads (
        id, name, email, phone, phone_digits, date_of_birth, address, city, tags,
        best_describes_you, program_interest, status, source, assigned_partner, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `,
      [
        lead.id,
        lead.name,
        lead.email,
        lead.phone,
        normalizePhoneDigits(lead.phone),
        lead.dateOfBirth,
        lead.address,
        lead.city,
        lead.tags,
        lead.bestDescribesYou,
        lead.programInterest,
        lead.status,
        lead.source,
        lead.assignedPartner ?? null,
        lead.createdAt,
      ],
    );
    return lead;
  }

  records.unshift(lead);
  return lead;
}
