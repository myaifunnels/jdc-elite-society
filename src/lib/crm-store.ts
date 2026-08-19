import { Pool } from "pg";

import { contactSeed } from "@/data/crm";
import { normalizeContact } from "@/lib/contact-fields";
import { AuthUser, ContactKind, ContactRecord, DashboardMetric, PartnerMapPin } from "@/lib/types";

const memoryRecords: ContactRecord[] = contactSeed.map((contact) => normalizeContact(contact));
const memorySync: {
  lastSyncedAt: string | null;
  lastError: string | null;
  contactCount: number;
  webhookSecret: string;
} = {
  lastSyncedAt: null,
  lastError: null,
  contactCount: 0,
  webhookSecret: "",
};

export type CrmViewer = Pick<AuthUser, "role" | "name" | "email">;

export type GhlSyncState = {
  lastSyncedAt: string | null;
  lastError: string | null;
  contactCount: number;
  webhookSecret: string;
};

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
    CREATE TABLE IF NOT EXISTS crm_contacts (
      id TEXT PRIMARY KEY,
      ghl_id TEXT UNIQUE,
      email TEXT,
      kind TEXT NOT NULL,
      synced_from_ghl BOOLEAN NOT NULL DEFAULT FALSE,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS crm_contacts_email_idx ON crm_contacts (lower(email))
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS ghl_custom_field_defs (
      id TEXT PRIMARY KEY,
      location_id TEXT NOT NULL,
      name TEXT NOT NULL,
      field_key TEXT,
      data_type TEXT,
      model TEXT,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS ghl_sync_state (
      id INTEGER PRIMARY KEY,
      last_synced_at TIMESTAMPTZ,
      last_error TEXT,
      contact_count INTEGER DEFAULT 0,
      webhook_secret TEXT
    )
  `);
  tableReady = true;
}

function asContact(value: unknown): ContactRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as ContactRecord;
  if (!record.id || !record.name) {
    return null;
  }

  return normalizeContact({
    ...record,
    tags: Array.isArray(record.tags) ? record.tags : [],
    phone: record.phone ?? "",
    email: record.email ?? "",
    dateOfBirth: record.dateOfBirth ?? "",
    address: record.address ?? "",
    city: record.city ?? "",
    bestDescribesYou: record.bestDescribesYou ?? "",
    programInterest: record.programInterest ?? "",
    status: record.status ?? "new",
    source: record.source ?? "",
    kind: record.kind === "partner" ? "partner" : "contact",
    createdAt: record.createdAt || new Date().toISOString().slice(0, 10),
  });
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

function filterVisible(records: ContactRecord[], viewer: CrmViewer) {
  if (viewer.role === "admin") {
    return records;
  }

  if (viewer.role === "partner") {
    return records.filter((contact) => isOwnPartnerRecord(contact, viewer) || isAssignedToViewer(contact, viewer));
  }

  return [];
}

function sortContacts(records: ContactRecord[]) {
  return [...records].sort((a, b) => {
    const left = a.updatedAt || a.createdAt;
    const right = b.updatedAt || b.createdAt;
    return right.localeCompare(left);
  });
}

async function loadPersistedContacts(): Promise<ContactRecord[] | null> {
  const client = getPool();
  if (!client) {
    return null;
  }

  try {
    await ensureTable(client);
    const result = await client.query("SELECT payload FROM crm_contacts ORDER BY updated_at DESC");
    const contacts = result.rows
      .map((row) => asContact(row.payload))
      .filter((contact): contact is ContactRecord => Boolean(contact));
    return contacts;
  } catch (error) {
    console.error("Failed to load CRM contacts", error);
    return null;
  }
}

async function allContacts() {
  const persisted = (await loadPersistedContacts()) ?? [];
  const state = await getGhlSyncState();

  if (state.lastSyncedAt) {
    return persisted;
  }

  const merged = new Map(memoryRecords.map((contact) => [contact.id, contact]));
  for (const contact of persisted) {
    merged.set(contact.id, contact);
  }
  return [...merged.values()];
}

export async function listContacts(viewer: CrmViewer, kind?: ContactKind) {
  const visible = filterVisible(await allContacts(), viewer);
  const filtered = kind ? visible.filter((contact) => contact.kind === kind) : visible;
  return sortContacts(filtered);
}

export async function listLeads(viewer: CrmViewer) {
  return listContacts(viewer, "contact");
}

export async function getContact(viewer: CrmViewer, id: string) {
  return (await listContacts(viewer)).find((contact) => contact.id === id || contact.ghlId === id) ?? null;
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

async function findExisting(record: ContactRecord) {
  const persisted = (await loadPersistedContacts()) ?? [];
  const contacts = [...memoryRecords];
  for (const contact of persisted) {
    const index = contacts.findIndex(
      (item) =>
        item.id === contact.id ||
        (contact.ghlId && item.ghlId === contact.ghlId) ||
        (contact.email && item.email && item.email.toLowerCase() === contact.email.toLowerCase()),
    );
    if (index >= 0) {
      contacts[index] = contact;
    } else {
      contacts.push(contact);
    }
  }

  return (
    contacts.find((contact) => record.ghlId && contact.ghlId === record.ghlId) ??
    contacts.find((contact) => contact.id === record.id) ??
    contacts.find(
      (contact) => record.email && contact.email && contact.email.toLowerCase() === record.email.toLowerCase(),
    ) ??
    null
  );
}

export async function upsertContact(input: ContactRecord) {
  const existing = await findExisting(input);
  const record = normalizeContact({
    ...existing,
    ...input,
    id: existing?.id || input.id,
    createdAt: existing?.createdAt || input.createdAt,
    updatedAt: input.updatedAt || new Date().toISOString(),
    standardFields: input.syncedFromGhl
      ? input.standardFields
      : input.standardFields?.length
        ? input.standardFields
        : existing?.standardFields,
    customFields: input.syncedFromGhl
      ? input.customFields
      : input.customFields?.length
        ? input.customFields
        : existing?.customFields,
  });

  const memoryIndex = memoryRecords.findIndex(
    (contact) => contact.id === record.id || (record.ghlId && contact.ghlId === record.ghlId),
  );
  if (memoryIndex >= 0) {
    memoryRecords[memoryIndex] = record;
  } else {
    memoryRecords.unshift(record);
  }

  const client = getPool();
  if (client) {
    try {
      await ensureTable(client);
      await client.query(
        `
        INSERT INTO crm_contacts (id, ghl_id, email, kind, synced_from_ghl, payload, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          ghl_id = COALESCE(EXCLUDED.ghl_id, crm_contacts.ghl_id),
          email = EXCLUDED.email,
          kind = EXCLUDED.kind,
          synced_from_ghl = EXCLUDED.synced_from_ghl,
          payload = EXCLUDED.payload,
          updated_at = EXCLUDED.updated_at
        `,
        [
          record.id,
          record.ghlId || null,
          record.email || null,
          record.kind,
          Boolean(record.syncedFromGhl),
          JSON.stringify(record),
          record.createdAt,
          record.updatedAt,
        ],
      );
    } catch (error) {
      console.error("Failed to persist CRM contact", error);
    }
  }

  return record;
}

export async function createLead(
  payload: Omit<ContactRecord, "id" | "createdAt" | "status" | "source" | "kind" | "standardFields" | "customFields"> & {
    source?: string;
    standardFields?: ContactRecord["standardFields"];
    customFields?: ContactRecord["customFields"];
  },
) {
  const lead = normalizeContact({
    id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind: "contact",
    createdAt: new Date().toISOString().slice(0, 10),
    status: "new",
    source: payload.source ?? "Website form",
    syncedFromGhl: false,
    ...payload,
  });

  return upsertContact(lead);
}

export async function deleteContactByGhlId(ghlId: string) {
  const index = memoryRecords.findIndex((contact) => contact.ghlId === ghlId || contact.id === `ghl-${ghlId}`);
  if (index >= 0) {
    memoryRecords.splice(index, 1);
  }

  const client = getPool();
  if (!client) {
    return;
  }

  try {
    await ensureTable(client);
    await client.query("DELETE FROM crm_contacts WHERE ghl_id = $1 OR id = $2", [ghlId, `ghl-${ghlId}`]);
  } catch (error) {
    console.error("Failed to delete CRM contact", error);
  }
}

export async function replaceGhlMirror(contacts: ContactRecord[]) {
  const incomingIds = new Set(contacts.map((contact) => contact.ghlId).filter(Boolean));

  for (const contact of contacts) {
    await upsertContact(contact);
  }

  const persisted = (await loadPersistedContacts()) ?? memoryRecords;
  const stale = persisted.filter(
    (contact) => contact.syncedFromGhl && contact.ghlId && !incomingIds.has(contact.ghlId),
  );

  for (const contact of stale) {
    if (contact.ghlId) {
      await deleteContactByGhlId(contact.ghlId);
    }
  }

  return contacts.length;
}

export type GhlCustomFieldDef = {
  id: string;
  locationId: string;
  name: string;
  fieldKey: string;
  dataType: string;
  model: string;
  payload: Record<string, unknown>;
};

export async function replaceCustomFieldDefs(defs: GhlCustomFieldDef[]) {
  const client = getPool();
  if (!client) {
    return;
  }

  try {
    await ensureTable(client);
    await client.query("DELETE FROM ghl_custom_field_defs");
    for (const def of defs) {
      await client.query(
        `
        INSERT INTO ghl_custom_field_defs (id, location_id, name, field_key, data_type, model, payload, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW())
        `,
        [def.id, def.locationId, def.name, def.fieldKey, def.dataType, def.model, JSON.stringify(def.payload)],
      );
    }
  } catch (error) {
    console.error("Failed to persist GHL custom field defs", error);
  }
}

export async function listCustomFieldDefs(): Promise<GhlCustomFieldDef[]> {
  const client = getPool();
  if (!client) {
    return [];
  }

  try {
    await ensureTable(client);
    const result = await client.query("SELECT * FROM ghl_custom_field_defs ORDER BY name ASC");
    return result.rows.map((row) => ({
      id: String(row.id),
      locationId: String(row.location_id ?? ""),
      name: String(row.name ?? ""),
      fieldKey: String(row.field_key ?? ""),
      dataType: String(row.data_type ?? ""),
      model: String(row.model ?? "contact"),
      payload: (row.payload && typeof row.payload === "object" ? row.payload : {}) as Record<string, unknown>,
    }));
  } catch (error) {
    console.error("Failed to load GHL custom field defs", error);
    return [];
  }
}

function createWebhookSecret() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

async function readSyncState(): Promise<GhlSyncState> {
  const client = getPool();
  if (!client) {
    if (!memorySync.webhookSecret) {
      memorySync.webhookSecret = createWebhookSecret();
    }
    return { ...memorySync };
  }

  try {
    await ensureTable(client);
    const result = await client.query("SELECT * FROM ghl_sync_state WHERE id = 1 LIMIT 1");
    const row = result.rows[0] as
      | {
          last_synced_at?: string;
          last_error?: string;
          contact_count?: number;
          webhook_secret?: string;
        }
      | undefined;

    if (!row) {
      const webhookSecret = createWebhookSecret();
      await client.query(
        `
        INSERT INTO ghl_sync_state (id, last_synced_at, last_error, contact_count, webhook_secret)
        VALUES (1, NULL, NULL, 0, $1)
        `,
        [webhookSecret],
      );
      return { lastSyncedAt: null, lastError: null, contactCount: 0, webhookSecret };
    }

    let webhookSecret = String(row.webhook_secret ?? "");
    if (!webhookSecret) {
      webhookSecret = createWebhookSecret();
      await client.query("UPDATE ghl_sync_state SET webhook_secret = $1 WHERE id = 1", [webhookSecret]);
    }

    return {
      lastSyncedAt: row.last_synced_at ? String(row.last_synced_at) : null,
      lastError: row.last_error ? String(row.last_error) : null,
      contactCount: Number(row.contact_count ?? 0),
      webhookSecret,
    };
  } catch (error) {
    console.error("Failed to load GHL sync state", error);
    if (!memorySync.webhookSecret) {
      memorySync.webhookSecret = createWebhookSecret();
    }
    return { ...memorySync };
  }
}

export async function getGhlSyncState() {
  return readSyncState();
}

export async function saveGhlSyncState(patch: Partial<GhlSyncState>) {
  const current = await readSyncState();
  const next: GhlSyncState = {
    lastSyncedAt: patch.lastSyncedAt === undefined ? current.lastSyncedAt : patch.lastSyncedAt,
    lastError: patch.lastError === undefined ? current.lastError : patch.lastError,
    contactCount: patch.contactCount ?? current.contactCount,
    webhookSecret: patch.webhookSecret || current.webhookSecret || createWebhookSecret(),
  };

  memorySync.lastSyncedAt = next.lastSyncedAt;
  memorySync.lastError = next.lastError;
  memorySync.contactCount = next.contactCount;
  memorySync.webhookSecret = next.webhookSecret;

  const client = getPool();
  if (client) {
    try {
      await ensureTable(client);
      await client.query(
        `
        INSERT INTO ghl_sync_state (id, last_synced_at, last_error, contact_count, webhook_secret)
        VALUES (1, $1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
          last_synced_at = EXCLUDED.last_synced_at,
          last_error = EXCLUDED.last_error,
          contact_count = EXCLUDED.contact_count,
          webhook_secret = EXCLUDED.webhook_secret
        `,
        [next.lastSyncedAt, next.lastError, next.contactCount, next.webhookSecret],
      );
    } catch (error) {
      console.error("Failed to save GHL sync state", error);
    }
  }

  return next;
}
