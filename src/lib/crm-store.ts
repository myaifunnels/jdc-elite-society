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
const hiddenEmails = new Set<string>();
const GHL_SYNC_MS = 60_000;
const TAG_CACHE_MS = 5 * 60 * 1000;
export const CONTACTS_PAGE_SIZE = 25;
let lastGhlSyncAt = 0;
let lastAddressSyncAt = 0;
let lastTagFetchAt = 0;
let cachedRemoteTags: string[] = [];
let tableReady = false;
let crmLoaded = false;
let ghlSyncing = false;
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
  await client.query(`
    CREATE TABLE IF NOT EXISTS crm_hidden_contacts (
      email TEXT PRIMARY KEY,
      hidden_at TIMESTAMPTZ DEFAULT NOW()
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
  if (crmLoaded) {
    return;
  }
  const client = getPool();
  if (!client) {
    crmLoaded = true;
    return;
  }

  try {
    await ensureTable(client);
    const hidden = await client.query("SELECT email FROM crm_hidden_contacts");
    hiddenEmails.clear();
    for (const row of hidden.rows) {
      hiddenEmails.add(String(row.email ?? "").toLowerCase());
    }
    const result = await client.query("SELECT payload FROM crm_contacts");
    for (const row of result.rows) {
      const contact = asContact(row.payload);
      if (contact && !isHiddenEmail(contact.email)) {
        upsertLocal(contact);
      }
    }
    crmLoaded = true;
  } catch (error) {
    console.error("Failed to load CRM contacts", error);
  }
}

function isHiddenEmail(email?: string) {
  return hiddenEmails.has((email ?? "").trim().toLowerCase());
}

async function persistContact(contact: ContactRecord) {
  if (isHiddenEmail(contact.email)) {
    return;
  }
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

function sameText(left?: string, right?: string) {
  return (left ?? "").toLowerCase().replace(/\s+/g, " ").trim() === (right ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function lookupAddress(contact: Pick<ContactRecord, "address" | "city" | "region">) {
  return [contact.address, contact.city, contact.region].filter(Boolean).join(", ");
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
    const incomingAddress = incoming.address?.trim() || "";
    const incomingCity = incoming.city?.trim() || "";
    const nextAddress =
      incomingAddress.length >= (current.address?.trim().length ?? 0) ? incomingAddress || current.address : current.address;
    const nextCity =
      incomingCity.length >= (current.city?.trim().length ?? 0) ? incomingCity || current.city : current.city;
    const addressChanged = !sameText(
      [nextAddress, nextCity, incoming.region || current.region].filter(Boolean).join(", "),
      lookupAddress(current),
    );
    memoryRecords[index] = {
      ...current,
      ...incoming,
      id: current.id,
      kind: current.kind === "partner" ? "partner" : incoming.kind,
      address: nextAddress,
      city: nextCity,
      assignedPartner: incoming.assignedPartner || current.assignedPartner,
      photoUrl: incoming.photoUrl || current.photoUrl,
      lat: incoming.lat ?? (addressChanged ? undefined : current.lat),
      lng: incoming.lng ?? (addressChanged ? undefined : current.lng),
      ghlContactId: incoming.ghlContactId || current.ghlContactId,
      tags: incoming.ghlContactId ? uniqueTags(incoming.tags) : uniqueTags([...(incoming.tags ?? []), ...current.tags]),
    };
    return;
  }

  memoryRecords.push(incoming);
}

async function withCoordinates(
  contact: ContactRecord,
  coords?: { lat?: number; lng?: number } | null,
): Promise<ContactRecord> {
  const lat = coords?.lat ?? contact.lat;
  const lng = coords?.lng ?? contact.lng;
  if (typeof lat === "number" && typeof lng === "number") {
    return { ...contact, lat, lng };
  }

  const lookup = lookupAddress(contact);
  if (!lookup) {
    return { ...contact, lat: undefined, lng: undefined };
  }

  const found = await geocodeAddress(lookup);
  return { ...contact, lat: found?.lat, lng: found?.lng };
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
    if (mapped && !isHiddenEmail(mapped.email)) {
      await persistContact(mapped);
    }
  }
}

async function applyAccountAddressesToContacts() {
  if (Date.now() - lastAddressSyncAt < 20_000) {
    return;
  }
  lastAddressSyncAt = Date.now();
  const { listAllUsers } = await import("@/lib/auth-store");
  const users = await listAllUsers();
  for (const user of users) {
    if (isHiddenEmail(user.email) || !user.address?.trim()) {
      continue;
    }
    const existing = memoryRecords.find(
      (record) => emailsMatch(record.email, user.email) || phonesMatch(record.phone, user.phone),
    );
    const next: ContactRecord = existing
      ? {
          ...existing,
          name: user.name || existing.name,
          phone: user.phone || existing.phone,
          address: user.address,
          photoUrl: user.facebookPhotoUrl || existing.photoUrl,
          bestDescribesYou: user.bestDescribesYou || existing.bestDescribesYou,
          programInterest: user.company || existing.programInterest,
          lat: sameText(user.address, existing.address) ? existing.lat : undefined,
          lng: sameText(user.address, existing.address) ? existing.lng : undefined,
        }
      : {
          id: `contact-${user.id}`,
          kind: user.role === "partner" ? "partner" : "contact",
          createdAt: user.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          status: "new",
          source: "Account profile",
          name: user.name,
          email: user.email,
          phone: user.phone ?? "",
          dateOfBirth: user.dateOfBirth ?? "",
          address: user.address,
          city: "",
          tags: uniqueTags(["Profile complete"]),
          bestDescribesYou: user.bestDescribesYou || "Not specified",
          programInterest: user.company || "JDC Elite Society",
          photoUrl: user.facebookPhotoUrl,
        };
    await persistContact(await withCoordinates(next));
  }
}

async function syncGhlInBackground() {
  if (ghlSyncing || Date.now() - lastGhlSyncAt < GHL_SYNC_MS) {
    return;
  }
  ghlSyncing = true;
  try {
    await syncGhlContacts();
  } finally {
    ghlSyncing = false;
  }
}

async function hydrateCrm() {
  await loadPersistedContacts();
  void syncGhlInBackground();
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
  const records = memoryRecords.filter((contact) => !isHiddenEmail(contact.email));
  if (viewer.seeAllContacts || viewer.role === "admin") {
    return records;
  }

  if (viewer.role === "partner") {
    return records.filter((contact) => isOwnPartnerRecord(contact, viewer) || isAssignedToViewer(contact, viewer));
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

export type PagedContacts = {
  items: ContactRecord[];
  total: number;
  page: number;
  pages: number;
  pageSize: number;
};

export async function listContactsPaged(
  viewer: CrmViewer,
  query: ContactKind | ContactQuery | undefined,
  page = 1,
  pageSize = CONTACTS_PAGE_SIZE,
): Promise<PagedContacts> {
  const all = await listContacts(viewer, query);
  const total = all.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pages);
  const start = (safePage - 1) * pageSize;
  return {
    items: all.slice(start, start + pageSize),
    total,
    page: safePage,
    pages,
    pageSize,
  };
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
  const contact = visibleToViewer(viewer).find((item) => item.id === id) ?? null;
  if (!contact) {
    return null;
  }

  if (contact.ghlContactId) {
    await ensurePortalUserForContact({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      bestDescribesYou: contact.bestDescribesYou,
      dateOfBirth: contact.dateOfBirth,
      address: contact.address,
      facebookPhotoUrl: contact.photoUrl,
      company: contact.programInterest,
    }).catch((error) => {
      console.error("Failed to provision GHL contact portal", contact.email, error);
    });
  }

  if (typeof contact.lat === "number" && typeof contact.lng === "number") {
    return contact;
  }
  if (!lookupAddress(contact)) {
    return contact;
  }

  const next = await withCoordinates(contact);
  await persistContact(next);
  return visibleToViewer(viewer).find((item) => item.id === id) ?? next;
}

export async function listAssignedContacts(viewer: CrmViewer, partnerName: string) {
  if (viewer.role !== "admin" && partnerName !== viewer.name) {
    return [];
  }

  return (await listContacts(viewer, "contact")).filter((contact) => contact.assignedPartner === partnerName);
}

export async function listPartnerMapPins(viewer: CrmViewer): Promise<PartnerMapPin[]> {
  return (await listContactMapPins(viewer, { kind: "partner" }, { geocode: false })).map((pin) => ({
    id: pin.id,
    name: pin.name,
    region: pin.region,
    address: pin.address,
    photoUrl: pin.photoUrl,
    lat: pin.lat,
    lng: pin.lng,
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

export async function listContactMapPins(
  viewer: CrmViewer,
  query?: ContactQuery,
  options?: { geocode?: boolean },
): Promise<ContactMapPin[]> {
  if (options?.geocode) {
    await applyAccountAddressesToContacts();
  }

  const contacts = await listContacts(viewer, query);
  const pins: ContactMapPin[] = [];
  let lookups = 0;
  const geocode = options?.geocode === true;

  for (const contact of contacts) {
    const existing = toMapPin(contact);
    if (existing) {
      pins.push(existing);
      continue;
    }

    if (!geocode) {
      continue;
    }

    const lookup = lookupAddress(contact);
    if (!lookup || lookups >= 40) {
      continue;
    }

    lookups += 1;
    const next = await withCoordinates(contact);
    await persistContact(next);
    const pin = toMapPin(next);
    if (pin) {
      pins.push(pin);
    }
  }

  return pins;
}

async function listGhlTagsCached() {
  if (Date.now() - lastTagFetchAt < TAG_CACHE_MS) {
    return cachedRemoteTags;
  }
  lastTagFetchAt = Date.now();
  cachedRemoteTags = await listGhlLocationTags();
  return cachedRemoteTags;
}

export async function listTagIndex(viewer: CrmViewer) {
  const [contacts, remote] = await Promise.all([listContacts(viewer), listGhlTagsCached()]);
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

export async function getContactByEmail(email: string) {
  await loadPersistedContacts();
  return memoryRecords.find((record) => emailsMatch(record.email, email)) ?? null;
}

export async function setContactAffiliateTag(
  viewer: CrmViewer,
  contactId: string,
  tag: "pioneer" | "jdc-partner",
  enabled: boolean,
) {
  const contact = await getContact(viewer, contactId);
  if (!contact) {
    return { ok: false as const, error: "Contact not found." };
  }

  const next = enabled
    ? uniqueTags([...contact.tags, tag])
    : contact.tags.filter((item) => item.toLowerCase() !== tag);
  return setContactTags(viewer, contactId, next);
}

export async function createLead(
  payload: Omit<ContactRecord, "id" | "createdAt" | "status" | "source" | "kind"> & {
    source?: string;
  },
) {
  await unhideContactEmail(payload.email);
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
        lat: payload.lat,
        lng: payload.lng,
      }
    : {
        id: `contact-${Date.now()}`,
        kind: "contact",
        createdAt: new Date().toISOString().slice(0, 10),
        status: "new",
        source: payload.source ?? "Website form",
        ...payload,
      };

  await persistContact(await withCoordinates(lead));
  return lead;
}

export async function upsertContactFromAccount(input: {
  email: string;
  name: string;
  phone?: string;
  address: string;
  city?: string;
  photoUrl?: string;
  bestDescribesYou?: string;
  programInterest?: string;
  lat?: number;
  lng?: number;
  source?: string;
  tags?: string[];
}) {
  if (isHiddenEmail(input.email)) {
    return;
  }
  await hydrateCrm();
  const existing = await findContactByEmailOrPhone(input.email, input.phone ?? "");
  const next: ContactRecord = existing
    ? {
        ...existing,
        name: input.name || existing.name,
        phone: input.phone || existing.phone,
        address: input.address,
        city: input.city || existing.city,
        photoUrl: input.photoUrl || existing.photoUrl,
        bestDescribesYou: input.bestDescribesYou || existing.bestDescribesYou,
        programInterest: input.programInterest || existing.programInterest,
        tags: uniqueTags([...(existing.tags ?? []), ...(input.tags ?? [])]),
        lat: input.lat,
        lng: input.lng,
      }
    : {
        id: `contact-${Date.now()}`,
        kind: "contact",
        createdAt: new Date().toISOString().slice(0, 10),
        status: "new",
        source: input.source ?? "Account profile",
        name: input.name,
        email: input.email,
        phone: input.phone ?? "",
        dateOfBirth: "",
        address: input.address,
        city: input.city ?? "",
        tags: uniqueTags(input.tags ?? ["Profile complete"]),
        bestDescribesYou: input.bestDescribesYou || "Not specified",
        programInterest: input.programInterest || "JDC Elite Society",
        photoUrl: input.photoUrl,
      };

  await persistContact(await withCoordinates(next, { lat: input.lat, lng: input.lng }));
}

export async function hideAndRemoveContactByEmail(email: string) {
  const key = email.trim().toLowerCase();
  if (!key) {
    return;
  }

  hiddenEmails.add(key);
  lastAddressSyncAt = 0;
  for (let index = memoryRecords.length - 1; index >= 0; index -= 1) {
    if (memoryRecords[index].email.toLowerCase() === key) {
      memoryRecords.splice(index, 1);
    }
  }

  const client = getPool();
  if (!client) {
    return;
  }

  try {
    await ensureTable(client);
    await client.query(
      `
      INSERT INTO crm_hidden_contacts (email, hidden_at)
      VALUES ($1, NOW())
      ON CONFLICT (email) DO NOTHING
      `,
      [key],
    );
    await client.query("DELETE FROM crm_contacts WHERE lower(email) = $1", [key]);
  } catch (error) {
    console.error("Failed to hide CRM contact", error);
  }
}

export async function unhideContactEmail(email: string) {
  const key = email.trim().toLowerCase();
  if (!key) {
    return;
  }
  hiddenEmails.delete(key);
  const client = getPool();
  if (!client) {
    return;
  }
  try {
    await ensureTable(client);
    await client.query("DELETE FROM crm_hidden_contacts WHERE email = $1", [key]);
  } catch (error) {
    console.error("Failed to unhide CRM contact", error);
  }
}
