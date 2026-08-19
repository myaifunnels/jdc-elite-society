import { Pool } from "pg";

import { contactSeed } from "@/data/crm";
import { listGhlLocationContacts, type GhlRemoteContact } from "@/lib/ghl";
import { AuthUser, ContactKind, ContactRecord, ContactStatus, DashboardMetric, PartnerMapPin } from "@/lib/types";

export type CrmViewer = Pick<AuthUser, "role" | "name" | "email">;

const memoryRecords: ContactRecord[] = [...contactSeed];
const GHL_SYNC_MS = 60_000;
let lastGhlSyncAt = 0;
let tableReady = false;
let pool: Pool | null | undefined;

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
    CREATE TABLE IF NOT EXISTS crm_contacts (
      id TEXT PRIMARY KEY,
      email TEXT,
      kind TEXT,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  tableReady = true;
}

function asContact(value: unknown): ContactRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as ContactRecord;
  if (!record.id || !record.email || !record.name) {
    return null;
  }

  return record;
}

async function loadPersistedContacts() {
  const client = getPool();
  if (!client) {
    return;
  }

  try {
    await ensureTable(client);
    const result = await client.query("SELECT payload FROM crm_contacts");
    for (const row of result.rows) {
      const contact = asContact(row.payload);
      if (contact) {
        upsertLocal(contact);
      }
    }
  } catch (error) {
    console.error("Failed to load CRM contacts", error);
  }
}

async function persistContact(contact: ContactRecord) {
  upsertLocal(contact);
  const client = getPool();
  if (!client) {
    return;
  }

  try {
    await ensureTable(client);
    await client.query(
      `
      INSERT INTO crm_contacts (id, email, kind, payload, updated_at)
      VALUES ($1, $2, $3, $4::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        kind = EXCLUDED.kind,
        payload = EXCLUDED.payload,
        updated_at = NOW()
      `,
      [contact.id, contact.email.toLowerCase(), contact.kind, JSON.stringify(contact)],
    );
  } catch (error) {
    console.error("Failed to persist CRM contact", error);
  }
}

function upsertLocal(incoming: ContactRecord) {
  const email = incoming.email.toLowerCase();
  const index = memoryRecords.findIndex(
    (record) => record.id === incoming.id || (email && record.email.toLowerCase() === email),
  );

  if (index >= 0) {
    const current = memoryRecords[index];
    memoryRecords[index] = {
      ...current,
      ...incoming,
      id: current.id,
      kind: current.kind === "partner" ? "partner" : incoming.kind,
      assignedPartner: incoming.assignedPartner || current.assignedPartner,
      photoUrl: incoming.photoUrl || current.photoUrl,
      lat: incoming.lat ?? current.lat,
      lng: incoming.lng ?? current.lng,
    };
    return;
  }

  memoryRecords.push(incoming);
}

function customField(contact: GhlRemoteContact, keys: string[]) {
  const fields = contact.customFields ?? [];
  for (const field of fields) {
    const key = String(field.key ?? field.id ?? "").toLowerCase();
    if (keys.some((item) => key.includes(item))) {
      return String(field.field_value ?? field.value ?? "").trim();
    }
  }
  return "";
}

function mapGhlStatus(tags: string[], type?: string): ContactStatus {
  const haystack = `${tags.join(" ")} ${type ?? ""}`.toLowerCase();
  if (haystack.includes("won") || haystack.includes("customer") || haystack.includes("closed")) {
    return "won";
  }
  if (haystack.includes("qualified")) {
    return "qualified";
  }
  if (haystack.includes("follow")) {
    return "follow-up";
  }
  if (haystack.includes("ramp")) {
    return "ramping";
  }
  if (haystack.includes("partner") || haystack.includes("active")) {
    return "active";
  }
  return "new";
}

function fromGhlContact(contact: GhlRemoteContact): ContactRecord | null {
  const email = String(contact.email ?? "").trim();
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim() || String(contact.name ?? "").trim();
  if (!email || !name) {
    return null;
  }

  const tags = (contact.tags ?? []).map((tag) => String(tag).trim()).filter(Boolean);
  const isPartner = tags.some((tag) => tag.toLowerCase().includes("partner")) || String(contact.type ?? "").toLowerCase() === "partner";
  const city = String(contact.city ?? "").trim();
  const region = String(contact.state ?? contact.country ?? "").trim();
  const address = [contact.address1, city, region].filter(Boolean).join(", ");
  const photoUrl = String(contact.profilePhoto ?? "").trim() || customField(contact, ["photo", "facebook_profile_picture"]);

  return {
    id: `ghl-${contact.id}`,
    kind: isPartner ? "partner" : "contact",
    name,
    email,
    phone: String(contact.phone ?? "").trim(),
    dateOfBirth: customField(contact, ["date_of_birth", "dob", "birthday"]),
    address,
    city,
    region: region || undefined,
    tags: tags.length ? tags : ["GHL"],
    bestDescribesYou: customField(contact, ["best_describes", "audience"]) || tags[0] || "GHL contact",
    programInterest: customField(contact, ["program"]) || "JDC Elite Society",
    status: mapGhlStatus(tags, contact.type),
    source: String(contact.source ?? "").trim() || "GHL · JDC Elite Society",
    assignedPartner: contact.assignedTo ? String(contact.assignedTo) : undefined,
    photoUrl: photoUrl || undefined,
    createdAt: String(contact.dateAdded ?? new Date().toISOString()).slice(0, 10),
  };
}

async function syncGhlContacts() {
  if (Date.now() - lastGhlSyncAt < GHL_SYNC_MS) {
    return;
  }

  lastGhlSyncAt = Date.now();
  const remote = await listGhlLocationContacts();
  if (remote.skipped) {
    return;
  }

  for (const item of remote.contacts) {
    const mapped = fromGhlContact(item);
    if (mapped) {
      await persistContact(mapped);
    }
  }
}

async function hydrateCrm() {
  await loadPersistedContacts();
  await syncGhlContacts();
}

function isOwnPartnerRecord(contact: ContactRecord, viewer: CrmViewer) {
  return (
    contact.kind === "partner" &&
    (contact.email.toLowerCase() === viewer.email.toLowerCase() || contact.name === viewer.name)
  );
}

function isAssignedToViewer(contact: ContactRecord, viewer: CrmViewer) {
  return contact.kind === "contact" && contact.assignedPartner === viewer.name;
}

function visibleToViewer(viewer: CrmViewer) {
  if (viewer.role === "admin") {
    return memoryRecords;
  }

  if (viewer.role === "partner") {
    return memoryRecords.filter((contact) => isOwnPartnerRecord(contact, viewer) || isAssignedToViewer(contact, viewer));
  }

  return [];
}

export async function listContacts(viewer: CrmViewer, kind?: ContactKind) {
  await hydrateCrm();
  const visible = visibleToViewer(viewer).slice().sort((left, right) => {
    const byDate = String(right.createdAt).localeCompare(String(left.createdAt));
    return byDate || left.name.localeCompare(right.name);
  });
  return kind ? visible.filter((contact) => contact.kind === kind) : visible;
}

export async function listLeads(viewer: CrmViewer) {
  return listContacts(viewer, "contact");
}

export async function getContact(viewer: CrmViewer, id: string) {
  await hydrateCrm();
  return visibleToViewer(viewer).find((contact) => contact.id === id) ?? null;
}

export async function listAssignedContacts(viewer: CrmViewer, partnerName: string) {
  if (viewer.role !== "admin" && partnerName !== viewer.name) {
    return [];
  }

  return (await listContacts(viewer, "contact")).filter((contact) => contact.assignedPartner === partnerName);
}

export async function listPartnerMapPins(viewer: CrmViewer): Promise<PartnerMapPin[]> {
  return (await listContacts(viewer, "partner"))
    .filter((partner): partner is ContactRecord & { lat: number; lng: number } => {
      return typeof partner.lat === "number" && typeof partner.lng === "number";
    })
    .map((partner) => ({
      id: partner.id,
      name: partner.name,
      region: partner.region ?? partner.city,
      address: partner.address,
      photoUrl: partner.photoUrl,
      lat: partner.lat,
      lng: partner.lng,
    }));
}

export async function listViewerMetrics(viewer: CrmViewer): Promise<DashboardMetric[]> {
  const contacts = await listContacts(viewer, "contact");
  const followUp = contacts.filter((contact) => contact.status === "follow-up" || contact.status === "qualified");
  const won = contacts.filter((contact) => contact.status === "won");

  return [
    {
      label: "Assigned contacts",
      value: String(contacts.length),
      detail: "People currently on your desk",
    },
    {
      label: "Need follow-up",
      value: String(followUp.length),
      detail: "Qualified or waiting on the next conversation",
    },
    {
      label: "Won",
      value: String(won.length),
      detail: "Closed from your assigned list",
    },
  ];
}

export async function createLead(
  payload: Omit<ContactRecord, "id" | "createdAt" | "status" | "source" | "kind"> & {
    source?: string;
  },
) {
  const lead: ContactRecord = {
    id: `contact-${Date.now()}`,
    kind: "contact",
    createdAt: new Date().toISOString().slice(0, 10),
    status: "new",
    source: payload.source ?? "Website form",
    ...payload,
  };

  await persistContact(lead);
  return lead;
}
