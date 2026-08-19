import { Pool } from "pg";

import { contactSeed } from "@/data/crm";
import { geocodeAddress } from "@/lib/geocode";
import { emailsMatch, phonesMatch } from "@/lib/identity";
import {
  addGhlContactTags,
  listGhlLocationContacts,
  listGhlLocationTags,
  removeGhlContactTags,
  type GhlRemoteContact,
} from "@/lib/ghl";
import { ensurePortalUserForContact } from "@/lib/auth-store";
import { TAG_GROUPS, uniqueTags } from "@/lib/tags";
import {
  AuthUser,
  ContactKind,
  ContactMapPin,
  ContactRecord,
  ContactStatus,
  DashboardMetric,
  PartnerMapPin,
} from "@/lib/types";

export type CrmViewer = Pick<AuthUser, "role" | "name" | "email"> & {
  seeAllContacts?: boolean;
};

const memoryRecords: ContactRecord[] = [...contactSeed];
const GHL_SYNC_MS = 60_000;
let lastGhlSyncAt = 0;
let tableReady = false;
let portalsBackfilled = false;
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
    (record) =>
      record.id === incoming.id ||
      (email && record.email.toLowerCase() === email) ||
      phonesMatch(record.phone, incoming.phone),
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
      ghlContactId: incoming.ghlContactId || current.ghlContactId,
      tags: incoming.ghlContactId ? uniqueTags(incoming.tags) : uniqueTags([...(incoming.tags ?? []), ...current.tags]),
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

function asCoord(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function fromGhlContact(contact: GhlRemoteContact): ContactRecord | null {
  const email = String(contact.email ?? "").trim();
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim() || String(contact.name ?? "").trim();
  if (!email || !name) {
    return null;
  }

  const tags = uniqueTags(contact.tags ?? []);
  const isPartner = tags.some((tag) => tag.toLowerCase().includes("partner")) || String(contact.type ?? "").toLowerCase() === "partner";
  const city = String(contact.city ?? "").trim();
  const region = String(contact.state ?? contact.country ?? "").trim();
  const address = [contact.address1, city, region].filter(Boolean).join(", ");
  const photoUrl = String(contact.profilePhoto ?? "").trim() || customField(contact, ["photo", "facebook_profile_picture"]);

  return {
    id: `ghl-${contact.id}`,
    ghlContactId: String(contact.id),
    kind: isPartner ? "partner" : "contact",
    name,
    email,
    phone: String(contact.phone ?? "").trim(),
    dateOfBirth: customField(contact, ["date_of_birth", "dob", "birthday"]),
    address,
    city,
    region: region || undefined,
    tags: tags.length ? tags : ["JDC Elite Society"],
    bestDescribesYou: customField(contact, ["best_describes", "audience"]) || tags[0] || "GHL contact",
    programInterest: customField(contact, ["program"]) || "JDC Elite Society",
    status: mapGhlStatus(tags, contact.type),
    source: String(contact.source ?? "").trim() || "GHL · JDC Elite Society",
    assignedPartner: contact.assignedTo ? String(contact.assignedTo) : undefined,
    photoUrl: photoUrl || undefined,
    lat: asCoord(contact.latitude),
    lng: asCoord(contact.longitude),
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
      await ensurePortalUserForContact({
        name: mapped.name,
        email: mapped.email,
        phone: mapped.phone,
        bestDescribesYou: mapped.bestDescribesYou,
        dateOfBirth: mapped.dateOfBirth,
        address: mapped.address,
        facebookPhotoUrl: mapped.photoUrl,
        company: mapped.programInterest,
      }).catch((error) => {
        console.error("Failed to provision GHL contact portal", mapped.email, error);
      });
    }
  }
}

async function provisionGhlPortals() {
  if (portalsBackfilled) {
    return;
  }
  portalsBackfilled = true;
  const contacts = memoryRecords.filter((contact) => contact.ghlContactId || contact.source.toLowerCase().includes("ghl"));
  for (const contact of contacts) {
    try {
      await ensurePortalUserForContact({
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        bestDescribesYou: contact.bestDescribesYou,
        dateOfBirth: contact.dateOfBirth,
        address: contact.address,
        facebookPhotoUrl: contact.photoUrl,
        company: contact.programInterest,
      });
    } catch (error) {
      console.error("Failed to provision GHL contact portal", contact.email, error);
    }
  }
}

async function hydrateCrm() {
  await loadPersistedContacts();
  await syncGhlContacts();
  await provisionGhlPortals();
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
  if (viewer.seeAllContacts || viewer.role === "admin") {
    return memoryRecords;
  }

  if (viewer.role === "partner") {
    return memoryRecords.filter((contact) => isOwnPartnerRecord(contact, viewer) || isAssignedToViewer(contact, viewer));
  }

  return [];
}

export type ContactQuery = {
  kind?: ContactKind;
  tags?: string[];
  q?: string;
};

function matchesQuery(contact: ContactRecord, query: ContactQuery) {
  if (query.kind && contact.kind !== query.kind) {
    return false;
  }

  const wanted = uniqueTags(query.tags ?? []);
  if (wanted.length) {
    const have = new Set(contact.tags.map((tag) => tag.toLowerCase()));
    if (!wanted.every((tag) => have.has(tag.toLowerCase()))) {
      return false;
    }
  }

  const needle = String(query.q ?? "").trim().toLowerCase();
  if (!needle) {
    return true;
  }

  const haystack = [contact.name, contact.email, contact.phone, contact.city, contact.region, contact.source, ...contact.tags]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

function rankMatch(contact: ContactRecord, needle: string) {
  const name = contact.name.toLowerCase();
  const email = contact.email.toLowerCase();
  if (name.startsWith(needle)) return 0;
  if (name.split(/\s+/).some((part) => part.startsWith(needle))) return 1;
  if (email.startsWith(needle)) return 2;
  if (name.includes(needle)) return 3;
  if (email.includes(needle)) return 4;
  return 5;
}

export async function listContacts(viewer: CrmViewer, kindOrQuery?: ContactKind | ContactQuery) {
  await hydrateCrm();
  const query: ContactQuery = typeof kindOrQuery === "string" ? { kind: kindOrQuery } : (kindOrQuery ?? {});
  return visibleToViewer(viewer)
    .filter((contact) => matchesQuery(contact, query))
    .slice()
    .sort((left, right) => {
      const byDate = String(right.createdAt).localeCompare(String(left.createdAt));
      return byDate || left.name.localeCompare(right.name);
    });
}

export type ContactSuggestion = {
  id: string;
  name: string;
  email: string;
  city: string;
  kind: ContactKind;
  photoUrl?: string;
  status: ContactRecord["status"];
};

export async function suggestContacts(
  viewer: CrmViewer,
  query: ContactQuery,
  limit = 8,
): Promise<{ contacts: ContactSuggestion[]; tags: Array<{ tag: string; count: number }> }> {
  const needle = String(query.q ?? "").trim().toLowerCase();
  const contacts = await listContacts(viewer, { kind: query.kind, tags: query.tags });
  const ranked = needle
    ? contacts
        .filter((contact) => matchesQuery(contact, { q: needle }))
        .sort((left, right) => rankMatch(left, needle) - rankMatch(right, needle) || left.name.localeCompare(right.name))
    : contacts;
  const tagIndex = await listTagIndex(viewer);
  const tags = needle
    ? tagIndex.filter((item) => item.tag.toLowerCase().includes(needle)).slice(0, 8)
    : tagIndex.filter((item) => item.count > 0).slice(0, 8);

  return {
    contacts: ranked.slice(0, limit).map((contact) => ({
      id: contact.id,
      name: contact.name,
      email: contact.email,
      city: contact.city || contact.region || "",
      kind: contact.kind,
      photoUrl: contact.photoUrl,
      status: contact.status,
    })),
    tags,
  };
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

function toMapPin(contact: ContactRecord): ContactMapPin | null {
  if (typeof contact.lat !== "number" || typeof contact.lng !== "number") {
    return null;
  }

  return {
    id: contact.id,
    name: contact.name,
    region: contact.region ?? contact.city,
    address: contact.address,
    photoUrl: contact.photoUrl,
    lat: contact.lat,
    lng: contact.lng,
    kind: contact.kind,
    tags: contact.tags,
  };
}

export async function listContactMapPins(viewer: CrmViewer, query?: ContactQuery): Promise<ContactMapPin[]> {
  const contacts = await listContacts(viewer, query);
  const pins: ContactMapPin[] = [];
  let lookups = 0;

  for (const contact of contacts) {
    const existing = toMapPin(contact);
    if (existing) {
      pins.push(existing);
      continue;
    }

    const lookup = [contact.address, contact.city, contact.region].filter(Boolean).join(", ");
    if (!lookup || lookups >= 8) {
      continue;
    }

    lookups += 1;
    const coords = await geocodeAddress(lookup);
    if (!coords) {
      continue;
    }

    const next = { ...contact, lat: coords.lat, lng: coords.lng };
    await persistContact(next);
    const pin = toMapPin(next);
    if (pin) {
      pins.push(pin);
    }
  }

  return pins;
}

export async function listTagIndex(viewer: CrmViewer) {
  const [contacts, remote] = await Promise.all([listContacts(viewer), listGhlLocationTags()]);
  const counts = new Map<string, number>();

  for (const contact of contacts) {
    for (const tag of uniqueTags(contact.tags)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  const catalog = uniqueTags([
    ...TAG_GROUPS.flatMap((group) => group.tags),
    ...remote,
    ...counts.keys(),
  ]);

  return catalog.map((tag) => ({ tag, count: counts.get(tag) ?? 0 }));
}

export async function setContactTags(viewer: CrmViewer, contactId: string, tags: string[]) {
  const contact = await getContact(viewer, contactId);
  if (!contact) {
    return { ok: false as const, error: "Contact not found." };
  }

  const nextTags = uniqueTags(tags);
  const current = uniqueTags(contact.tags);
  const added = nextTags.filter((tag) => !current.some((item) => item.toLowerCase() === tag.toLowerCase()));
  const removed = current.filter((tag) => !nextTags.some((item) => item.toLowerCase() === tag.toLowerCase()));

  await persistContact({ ...contact, tags: nextTags });

  if (contact.ghlContactId) {
    if (added.length) {
      await addGhlContactTags(contact.ghlContactId, added);
    }
    if (removed.length) {
      await removeGhlContactTags(contact.ghlContactId, removed);
    }
  }

  return { ok: true as const, tags: nextTags };
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

export async function findContactByEmailOrPhone(email: string, phone: string) {
  await loadPersistedContacts();
  return (
    memoryRecords.find(
      (record) => emailsMatch(record.email, email) || phonesMatch(record.phone, phone),
    ) ?? null
  );
}

export async function createLead(
  payload: Omit<ContactRecord, "id" | "createdAt" | "status" | "source" | "kind"> & {
    source?: string;
  },
) {
  const existing = await findContactByEmailOrPhone(payload.email, payload.phone);
  const lead: ContactRecord = existing
    ? {
        ...existing,
        ...payload,
        id: existing.id,
        kind: existing.kind,
        createdAt: existing.createdAt,
        status: existing.status,
        source: existing.source,
        tags: uniqueTags([...(existing.tags ?? []), ...(payload.tags ?? [])]),
      }
    : {
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
