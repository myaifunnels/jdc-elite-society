import { Pool } from "pg";

import { contactSeed } from "@/data/crm";
import { geocodeAddress } from "@/lib/geocode";
import { emailsMatch, phonesMatch } from "@/lib/identity";
import {
  addGhlContactTags,
  getGhlContactById,
  listGhlLocationContacts,
  listGhlLocationTags,
  lookupGhlContact,
  removeGhlContactTags,
  searchGhlContactsByTags,
  syncContactToGhl,
  type GhlRemoteContact,
} from "@/lib/ghl";
import {
  getMastermindBuyerPipeline,
  searchGhlOpportunities,
  updateGhlOpportunity,
  upsertGhlOpportunity,
  type GhlOpportunity,
} from "@/lib/ghl-opportunities";
import { mastermindOffer } from "@/data/mastermind-offer";
import {
  canonicalStageFromName,
  classifyPipelineStage,
  PIPELINE_GHL_FETCH_TAGS,
  PIPELINE_STAGES,
  pipelineStageValue,
  tagsForPipelineStage,
  type PipelineStageId,
} from "@/lib/pipeline";
import { ensurePortalUserForContact } from "@/lib/auth-store";
import { TAG_GROUPS, uniqueTags } from "@/lib/tags";
import {
  ADDRESS_CONFIRMED_TAG,
  MAP_PLACEHOLDER_TAG,
  hasAddressTag,
  isSamePlaceholderAddress,
  applyPlaceholderLocation,
  shouldUsePlaceholderAddress,
} from "@/lib/placeholder-addresses";
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
const REGISTRANT_HYDRATE_MS = 60_000;
const TAG_CACHE_MS = 5 * 60 * 1000;
export const CONTACTS_PAGE_SIZE = 25;
let lastGhlSyncAt = 0;
let lastRegistrantHydrateAt = 0;
let registrantHydrating = false;
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
    for (let index = memoryRecords.length - 1; index >= 0; index -= 1) {
      if (isHiddenEmail(memoryRecords[index].email)) {
        memoryRecords.splice(index, 1);
      }
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
  const next = withMapLocation(contact);
  upsertLocal(next);
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
      [next.id, next.email.toLowerCase(), next.kind, JSON.stringify(next)],
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

function withMapLocation(contact: ContactRecord): ContactRecord {
  if (!shouldUsePlaceholderAddress(contact)) {
    return contact;
  }
  const place = applyPlaceholderLocation(contact);
  return {
    ...contact,
    address: place.address,
    city: place.city,
    region: place.region,
    lat: place.lat,
    lng: place.lng,
    tags: uniqueTags([
      ...(contact.tags ?? []).filter((tag) => tag.toLowerCase() !== ADDRESS_CONFIRMED_TAG.toLowerCase()),
      MAP_PLACEHOLDER_TAG,
    ]),
  };
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
    const forceIncomingAddress = incoming.kind === "contact";
    const nextAddress = forceIncomingAddress
      ? incomingAddress || current.address
      : incomingAddress.length >= (current.address?.trim().length ?? 0)
        ? incomingAddress || current.address
        : current.address;
    const nextCity = forceIncomingAddress
      ? incomingCity || current.city
      : incomingCity.length >= (current.city?.trim().length ?? 0)
        ? incomingCity || current.city
        : current.city;
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
      region: forceIncomingAddress ? incoming.region || current.region : incoming.region || current.region,
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

const SERVICE_CONTACT_DOMAINS = new Set([
  "zoom.us",
  "zoomgov.com",
  "calendly.com",
  "stripe.com",
  "docusign.net",
  "mailchimp.com",
  "sendgrid.net",
  "sendgrid.com",
  "twilio.com",
  "github.com",
  "notion.so",
  "slack.com",
  "zapier.com",
  "hubspot.com",
  "intercom.io",
  "leadconnectorhq.com",
  "gohighlevel.com",
]);

const SERVICE_CONTACT_PREFIXES = [
  "noreply",
  "no-reply",
  "donotreply",
  "do-not-reply",
  "notifications",
  "notification",
  "notify",
  "mailer-daemon",
  "postmaster",
  "no",
  "alert",
  "alerts",
  "bot",
  "automated",
  "calendar-notification",
  "invite",
];

/** True for automated/company service addresses (Zoom, Calendly, etc.) rather than a real person. */
export function isServiceContactEmail(email: string) {
  const value = email.trim().toLowerCase();
  const at = value.lastIndexOf("@");
  if (at < 0) {
    return false;
  }
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  for (const serviceDomain of SERVICE_CONTACT_DOMAINS) {
    if (domain === serviceDomain || domain.endsWith(`.${serviceDomain}`)) {
      return true;
    }
  }
  return SERVICE_CONTACT_PREFIXES.some((prefix) => local === prefix || local.startsWith(`${prefix}.`) || local.startsWith(`${prefix}-`) || local.startsWith(`${prefix}+`));
}

function fromGhlContact(contact: GhlRemoteContact): ContactRecord | null {
  const ghlId = String(contact.id ?? "").trim();
  const email =
    String(contact.email ?? "").trim() || (ghlId ? `contact.${ghlId}@ghl.invalid` : "");
  const name =
    [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim() ||
    String(contact.name ?? "").trim() ||
    String(contact.phone ?? "").trim() ||
    (email.includes("@") ? email.split("@")[0] : "") ||
    "GHL contact";
  if (!ghlId || !email || isServiceContactEmail(email)) {
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
  await applyPlaceholderAddresses();
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

async function hydrateRegistrantsIntoCrm() {
  if (registrantHydrating || Date.now() - lastRegistrantHydrateAt < REGISTRANT_HYDRATE_MS) {
    return;
  }
  registrantHydrating = true;
  try {
    const { listMemberRegistrations } = await import("@/lib/auth-store");
    const members = await listMemberRegistrations();
    for (const user of members) {
      if (isHiddenEmail(user.email)) {
        continue;
      }
      const existing = memoryRecords.find(
        (record) => emailsMatch(record.email, user.email) || phonesMatch(record.phone, user.phone),
      );
      const paymentTag = user.paymentVerified ? "Payment verified" : "Payment pending";
      const profileTag = user.profileComplete ? "Profile complete" : "Profile incomplete";
      const nextTags = uniqueTags([
        ...(existing?.tags ?? []),
        "Registrant",
        paymentTag,
        profileTag,
      ]).filter((tag) => {
        if (user.paymentVerified && tag.toLowerCase() === "payment pending") {
          return false;
        }
        if (!user.paymentVerified && tag.toLowerCase() === "payment verified") {
          return false;
        }
        if (user.profileComplete && tag.toLowerCase() === "profile incomplete") {
          return false;
        }
        if (!user.profileComplete && tag.toLowerCase() === "profile complete") {
          return false;
        }
        return true;
      });
      if (existing) {
        const next = {
          ...existing,
          name: user.name || existing.name,
          phone: user.phone || existing.phone,
          address: user.address || existing.address,
          photoUrl: existing.photoUrl || user.facebookPhotoUrl,
          dateOfBirth: existing.dateOfBirth || user.dateOfBirth || "",
          bestDescribesYou: existing.bestDescribesYou || user.bestDescribesYou || "Not specified",
          tags: nextTags,
        };
        const unchanged =
          next.name === existing.name &&
          next.phone === existing.phone &&
          next.address === existing.address &&
          next.photoUrl === existing.photoUrl &&
          next.dateOfBirth === existing.dateOfBirth &&
          next.tags.join("|") === existing.tags.join("|");
        if (!unchanged) {
          await persistContact(next);
        }
      } else {
        await persistContact({
          id: `contact-reg-${user.id}`,
          kind: "contact",
          createdAt: (user.createdAt || new Date().toISOString()).slice(0, 10),
          status: user.paymentVerified ? "qualified" : "new",
          source: "Member registration",
          name: user.name,
          email: user.email,
          phone: user.phone ?? "",
          dateOfBirth: user.dateOfBirth ?? "",
          address: user.address ?? "",
          city: "",
          tags: nextTags,
          bestDescribesYou: user.bestDescribesYou || "Not specified",
          programInterest: "JDC Elite Society",
          photoUrl: user.facebookPhotoUrl,
        });
      }
    }
    lastRegistrantHydrateAt = Date.now();
  } catch (error) {
    console.error("Failed to hydrate registrants into CRM", error);
  } finally {
    registrantHydrating = false;
  }
}

async function hydrateCrm() {
  await loadPersistedContacts();
  void syncGhlInBackground();
  await hydrateRegistrantsIntoCrm();
  await applyPlaceholderAddresses();
}

export function contactNeedsAddressConfirm(contact?: { tags?: string[] } | null) {
  return !hasAddressTag(contact?.tags, ADDRESS_CONFIRMED_TAG);
}

async function applyPlaceholderAddresses() {
  for (const record of [...memoryRecords]) {
    if (!shouldUsePlaceholderAddress(record)) {
      continue;
    }
    const located = withMapLocation(record);
    if (
      sameText(located.address, record.address) &&
      located.lat === record.lat &&
      located.lng === record.lng &&
      hasAddressTag(record.tags, MAP_PLACEHOLDER_TAG)
    ) {
      continue;
    }
    await persistContact(located);
  }
}

export async function contactIdsByEmail() {
  await hydrateCrm();
  const map = new Map<string, string>();
  for (const record of memoryRecords) {
    if (record.email) {
      map.set(record.email.toLowerCase(), record.id);
    }
  }
  return map;
}

export function invalidateRegistrantCrmSync() {
  lastRegistrantHydrateAt = 0;
}

export function invalidateGhlContactSync() {
  lastGhlSyncAt = 0;
}

export async function refreshGhlContacts() {
  lastGhlSyncAt = 0;
  await syncGhlContacts();
}

export async function ingestGhlRemoteContact(remote: GhlRemoteContact) {
  const mapped = fromGhlContact(remote);
  if (!mapped || isHiddenEmail(mapped.email)) {
    return null;
  }
  await persistContact(mapped);
  return mapped;
}

export async function ingestGhlContactById(contactId: string) {
  const remote = await getGhlContactById(contactId);
  if (!remote) {
    return null;
  }
  return ingestGhlRemoteContact(remote);
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
    .map(withMapLocation)
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

function findVisibleContact(viewer: CrmViewer, rawId: string) {
  const id = decodeURIComponent(rawId).trim();
  if (!id) {
    return null;
  }

  const needle = id.toLowerCase();
  return (
    visibleToViewer(viewer).find(
      (item) =>
        item.id === id ||
        item.ghlContactId === id ||
        item.email.toLowerCase() === needle ||
        emailsMatch(item.email, id),
    ) ?? null
  );
}

async function enrichContact(viewer: CrmViewer, contact: ContactRecord) {
  const located = withMapLocation(contact);

  if (located.ghlContactId || located.kind === "contact") {
    await ensurePortalUserForContact({
      name: located.name,
      email: located.email,
      phone: located.phone,
      bestDescribesYou: located.bestDescribesYou,
      dateOfBirth: located.dateOfBirth,
      address: located.address,
      facebookPhotoUrl: located.photoUrl,
      company: located.programInterest,
    }).catch((error) => {
      console.error("Failed to provision contact portal", located.email, error);
    });
  }

  if (typeof located.lat === "number" && typeof located.lng === "number") {
    return located;
  }
  if (!lookupAddress(located) || shouldUsePlaceholderAddress(located)) {
    return located;
  }

  try {
    const next = await withCoordinates(located);
    await persistContact(next);
    return withMapLocation(findVisibleContact(viewer, next.id) ?? next);
  } catch (error) {
    console.error("Failed to geocode contact", located.id, error);
    return located;
  }
}

export async function getContact(viewer: CrmViewer, id: string) {
  await hydrateCrm();
  const contact = findVisibleContact(viewer, id);
  if (!contact) {
    return null;
  }

  return enrichContact(viewer, contact);
}

export async function resolveContactDashboard(viewer: CrmViewer, rawId: string) {
  const existing = await getContact(viewer, rawId);
  if (existing) {
    return existing;
  }

  const id = decodeURIComponent(rawId).trim();
  if (!id || !(viewer.seeAllContacts || viewer.role === "admin")) {
    return null;
  }

  try {
    const { findUserById, findUserByEmail } = await import("@/lib/auth-store");
    const account = (await findUserById(id)) ?? (id.includes("@") ? await findUserByEmail(id) : null);
    if (!account || account.role === "admin") {
      return null;
    }

    await unhideContactEmail(account.email);
    await upsertContactFromAccount({
      email: account.email,
      name: account.name,
      phone: account.phone,
      address: account.address ?? "",
      city: "",
      photoUrl: account.facebookPhotoUrl,
      bestDescribesYou: account.bestDescribesYou,
      programInterest: account.company,
      source: "Portal account",
      tags: ["Registration"],
    });

    return (
      findVisibleContact(viewer, account.email) ??
      findVisibleContact(viewer, account.id) ??
      (await getContact(viewer, account.email))
    );
  } catch (error) {
    console.error("Failed to rebuild contact dashboard", rawId, error);
    return null;
  }
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

function pinPhotoUrl(contact: ContactRecord, photosByEmail?: Map<string, string>) {
  return contact.photoUrl?.trim() || photosByEmail?.get(contact.email.toLowerCase()) || undefined;
}

function toMapPin(contact: ContactRecord, photosByEmail?: Map<string, string>): ContactMapPin | null {
  const located = withMapLocation(contact);
  if (typeof located.lat !== "number" || typeof located.lng !== "number") {
    return null;
  }

  return {
    id: located.id,
    name: located.name,
    region: located.region ?? located.city,
    address: located.address,
    photoUrl: pinPhotoUrl(located, photosByEmail),
    lat: located.lat,
    lng: located.lng,
    kind: located.kind,
    tags: located.tags,
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
  const { listAllUsers } = await import("@/lib/auth-store");
  const users = await listAllUsers();
  const photosByEmail = new Map(
    users.flatMap((user) => {
      const photo = user.facebookPhotoUrl?.trim();
      return photo ? [[user.email.toLowerCase(), photo] as const] : [];
    }),
  );
  const pins: ContactMapPin[] = [];
  let lookups = 0;
  const geocode = options?.geocode === true;

  for (const contact of contacts) {
    const existing = toMapPin(contact, photosByEmail);
    if (existing) {
      pins.push(existing);
      continue;
    }

    if (!geocode || shouldUsePlaceholderAddress(contact)) {
      continue;
    }

    const lookup = lookupAddress(contact);
    if (!lookup || lookups >= 40) {
      continue;
    }

    lookups += 1;
    const next = await withCoordinates(contact);
    await persistContact(next);
    const pin = toMapPin(next, photosByEmail);
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

  let ghlSynced = !contact.ghlContactId;
  if (contact.ghlContactId) {
    ghlSynced = true;
    if (added.length) {
      const result = await addGhlContactTags(contact.ghlContactId, added);
      if (!result.skipped && result.ok === false) {
        ghlSynced = false;
      }
    }
    if (removed.length) {
      const result = await removeGhlContactTags(contact.ghlContactId, removed);
      if (!result.skipped && result.ok === false) {
        ghlSynced = false;
      }
    }
  }

  return { ok: true as const, tags: nextTags, ghlSynced };
}

async function ensureGhlLink(contact: ContactRecord): Promise<ContactRecord> {
  if (contact.ghlContactId) {
    return contact;
  }

  const existing = await lookupGhlContact(contact.email, contact.phone);
  if (existing?.id) {
    const next = { ...contact, ghlContactId: String(existing.id) };
    await persistContact(next);
    return next;
  }

  const synced = await syncContactToGhl({
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    address: contact.address,
    city: contact.city,
    tags: contact.tags,
    source: contact.source,
    facebookPhotoUrl: contact.photoUrl,
    bestDescribesYou: contact.bestDescribesYou,
  });
  if (synced.contactId) {
    const next = { ...contact, ghlContactId: synced.contactId };
    await persistContact(next);
    return next;
  }

  return contact;
}

export type PipelineBoardStage = {
  id: string;
  label: string;
  detail: string;
  canonical?: PipelineStageId;
};

export type PipelineCard = {
  id: string;
  contactId: string;
  name: string;
  email: string;
  phone: string;
  photoUrl?: string;
  city: string;
  tags: string[];
  stage: string;
  monetaryValue: number;
  ghlContactId?: string;
  opportunityId?: string;
};

export type PipelineBoard = {
  pipelineName: string;
  pipelineId?: string;
  stages: PipelineBoardStage[];
  cards: PipelineCard[];
  totalValue: number;
};

function fallbackPipelineStages(): PipelineBoardStage[] {
  return PIPELINE_STAGES.map((stage) => ({
    id: stage.id,
    label: stage.label,
    detail: stage.detail,
    canonical: stage.id,
  }));
}

function stagesFromGhlPipeline(name: string, ghlStages: Array<{ id: string; name: string }>): PipelineBoardStage[] {
  const mapped = ghlStages.map((stage) => {
    const canonical = canonicalStageFromName(stage.name);
    const fallback = PIPELINE_STAGES.find((item) => item.id === canonical);
    return {
      id: stage.id,
      label: fallback?.label ?? stage.name,
      detail: fallback?.detail ?? `${name} · ${stage.name}`,
      canonical: canonical ?? undefined,
    };
  });

  const have = new Set(mapped.map((stage) => stage.canonical).filter(Boolean));
  const missing = PIPELINE_STAGES.filter((stage) => !have.has(stage.id)).map((stage) => ({
    id: stage.id,
    label: stage.label,
    detail: stage.detail,
    canonical: stage.id,
  }));

  const payment = mapped.find((stage) => stage.canonical === "payment");
  const leads = mapped.find((stage) => stage.canonical === "leads");
  const first = mapped.find((stage) => stage.canonical === "first-batch");
  const second = mapped.find((stage) => stage.canonical === "second-batch");
  const extras = mapped.filter(
    (stage) => stage !== payment && stage !== leads && stage !== first && stage !== second,
  );
  const ordered = [leads, payment, first, second, ...extras, ...missing].filter(Boolean) as PipelineBoardStage[];
  const seen = new Set<string>();
  return ordered.filter((stage) => {
    if (seen.has(stage.id)) {
      return false;
    }
    seen.add(stage.id);
    return true;
  });
}

function resolveOpportunityValue(opportunity: Pick<GhlOpportunity, "monetaryValue" | "email">, prices: Map<string, number>) {
  if (opportunity.monetaryValue > 0) {
    return opportunity.monetaryValue;
  }
  const priced = prices.get(opportunity.email.toLowerCase());
  if (priced && priced > 0) {
    return priced;
  }
  return mastermindOffer.offerPrice;
}

async function ingestPipelineTaggedContacts() {
  const remotes = await searchGhlContactsByTags(PIPELINE_GHL_FETCH_TAGS);
  for (const remote of remotes) {
    await ingestGhlRemoteContact(remote);
  }
}

async function contactFromOpportunity(opportunity: GhlOpportunity) {
  if (opportunity.contactId) {
    const byGhl = memoryRecords.find((record) => record.ghlContactId === opportunity.contactId);
    if (byGhl) {
      return byGhl;
    }
    const ingested = await ingestGhlContactById(opportunity.contactId);
    if (ingested) {
      return ingested;
    }
  }
  if (opportunity.email) {
    const existing = await getContactByEmail(opportunity.email);
    if (existing) {
      return existing;
    }
  }
  return null;
}

export async function listPipelineBoard(viewer: CrmViewer, pendingEmails: Set<string> = new Set(), prices: Map<string, number> = new Map()) {
  await refreshGhlContacts().catch((error) => console.error("Pipeline GHL refresh failed", error));
  await ingestPipelineTaggedContacts().catch((error) => console.error("Pipeline GHL tag fetch failed", error));
  await listContacts(viewer);

  const pipeline = await getMastermindBuyerPipeline();
  if (pipeline) {
    const opportunities = await searchGhlOpportunities(pipeline.id);
    const stages = stagesFromGhlPipeline(pipeline.name, pipeline.stages);
    const cards: PipelineCard[] = [];
    const seenEmails = new Set<string>();

    for (const opportunity of opportunities) {
      if (opportunity.status === "lost" || opportunity.status === "abandoned") {
        continue;
      }
      const contact = await contactFromOpportunity(opportunity);
      const email = (contact?.email || opportunity.email).toLowerCase();
      const stage =
        stages.find((item) => item.id === opportunity.pipelineStageId)?.id ??
        stages.find((item) => item.canonical === "leads")?.id ??
        stages[0]?.id;
      if (!stage) {
        continue;
      }
      const monetaryValue = resolveOpportunityValue(opportunity, prices);
      cards.push({
        id: `opp-${opportunity.id}`,
        contactId: contact?.id ?? `ghl-${opportunity.contactId || opportunity.id}`,
        name: contact?.name || opportunity.contactName || opportunity.name || opportunity.email || "GHL contact",
        email: contact?.email || opportunity.email,
        phone: contact?.phone || opportunity.phone,
        photoUrl: contact?.photoUrl,
        city: contact?.city || contact?.region || "",
        tags: contact?.tags ?? [],
        stage,
        monetaryValue,
        ghlContactId: contact?.ghlContactId || opportunity.contactId,
        opportunityId: opportunity.id,
      });
      if (email) {
        seenEmails.add(email);
      }
    }

    for (const email of pendingEmails) {
      if (seenEmails.has(email)) {
        continue;
      }
      const contact = await getContactByEmail(email);
      const paymentStage = stages.find((item) => item.canonical === "payment") ?? stages.find((item) => item.id === "payment");
      if (!contact || !paymentStage) {
        continue;
      }
      cards.push({
        id: contact.id,
        contactId: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        photoUrl: contact.photoUrl,
        city: contact.city || contact.region || "",
        tags: contact.tags,
        stage: paymentStage.id,
        monetaryValue: prices.get(email) || mastermindOffer.offerPrice,
        ghlContactId: contact.ghlContactId,
      });
    }

    return {
      pipelineName: pipeline.name,
      pipelineId: pipeline.id,
      stages,
      cards,
      totalValue: pipelineStageValue(cards),
    } satisfies PipelineBoard;
  }

  const stages = fallbackPipelineStages();
  const contacts = await listContacts(viewer);
  const cards = contacts
    .filter((contact) => contact.kind === "contact" || contact.ghlContactId)
    .map((contact) => {
      const canonical = classifyPipelineStage(contact.tags, {
        paymentPending: pendingEmails.has(contact.email.toLowerCase()),
      });
      return {
        id: contact.id,
        contactId: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        photoUrl: contact.photoUrl,
        city: contact.city || contact.region || "",
        tags: contact.tags,
        stage: canonical,
        monetaryValue: prices.get(contact.email.toLowerCase()) || (canonical === "leads" ? 0 : mastermindOffer.offerPrice),
        ghlContactId: contact.ghlContactId,
      } satisfies PipelineCard;
    });

  return {
    pipelineName: "jdc-mastermind-buyer",
    stages,
    cards,
    totalValue: pipelineStageValue(cards),
  } satisfies PipelineBoard;
}

export async function setPipelineStage(viewer: CrmViewer, cardId: string, stageId: string) {
  const pipeline = await getMastermindBuyerPipeline();
  const ghlStage = pipeline?.stages.find((stage) => stage.id === stageId);
  const canonical =
    (ghlStage ? canonicalStageFromName(ghlStage.name) : null) ??
    (stageId as PipelineStageId | undefined);
  const resolvedGhlStage =
    ghlStage ??
    pipeline?.stages.find((stage) => canonicalStageFromName(stage.name) === stageId) ??
    null;

  const opportunityId = cardId.startsWith("opp-") ? cardId.slice(4) : undefined;
  let contact = opportunityId ? null : await getContact(viewer, cardId);

  if (!contact && opportunityId) {
    const { getGhlOpportunityById } = await import("@/lib/ghl-opportunities");
    const opportunity = await getGhlOpportunityById(opportunityId);
    if (opportunity?.contactId) {
      contact = await ingestGhlContactById(opportunity.contactId);
    }
    if (!contact && opportunity?.email) {
      contact = await getContactByEmail(opportunity.email);
    }
  }

  if (resolvedGhlStage && pipeline) {
    if (opportunityId) {
      const moved = await updateGhlOpportunity(opportunityId, { pipelineStageId: resolvedGhlStage.id });
      if (!moved.ok && !moved.skipped) {
        return { ok: false as const, error: "GoHighLevel did not accept that stage move." };
      }
    } else if (contact) {
      const linked = await ensureGhlLink(contact);
      contact = linked;
      if (linked.ghlContactId) {
        const upserted = await upsertGhlOpportunity({
          contactId: linked.ghlContactId,
          pipelineId: pipeline.id,
          pipelineStageId: resolvedGhlStage.id,
          name: linked.name,
          monetaryValue: mastermindOffer.offerPrice,
        });
        if (!upserted.ok && !upserted.skipped) {
          return { ok: false as const, error: "Could not create the GHL opportunity." };
        }
      }
    }
  }

  if (contact && canonical && ["leads", "payment", "first-batch", "second-batch"].includes(canonical)) {
    const linked = await ensureGhlLink(contact);
    const result = await setContactTags(viewer, linked.id, tagsForPipelineStage(linked.tags, canonical as PipelineStageId));
    if (!result.ok) {
      return result;
    }
    if (linked.ghlContactId && !result.ghlSynced) {
      return { ok: false as const, error: "Stage saved here, but GoHighLevel tag sync failed. Try again." };
    }
    return result;
  }

  if (opportunityId && resolvedGhlStage) {
    return { ok: true as const, tags: [] as string[], ghlSynced: true };
  }

  return { ok: false as const, error: "Contact not found." };
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
  const record = memoryRecords.find((item) => emailsMatch(item.email, email)) ?? null;
  return record ? withMapLocation(record) : null;
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
  const nextId = existing?.id ?? `contact-${Date.now()}`;
  const confirmed = Boolean(input.address.trim()) && !isSamePlaceholderAddress(nextId, input.address);
  const nextTags = uniqueTags([
    ...(existing?.tags ?? []).filter(
      (tag) =>
        tag.toLowerCase() !== MAP_PLACEHOLDER_TAG.toLowerCase() &&
        tag.toLowerCase() !== ADDRESS_CONFIRMED_TAG.toLowerCase(),
    ),
    ...(input.tags ?? []),
    confirmed ? ADDRESS_CONFIRMED_TAG : MAP_PLACEHOLDER_TAG,
  ]);
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
        tags: nextTags,
        lat: input.lat,
        lng: input.lng,
      }
    : {
        id: nextId,
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
        tags: nextTags,
        bestDescribesYou: input.bestDescribesYou || "Not specified",
        programInterest: input.programInterest || "JDC Elite Society",
        photoUrl: input.photoUrl,
      };

  await persistContact(await withCoordinates(next, { lat: input.lat, lng: input.lng }));
}

/** One-time cleanup: hides and removes any already-synced service/company contacts (Zoom, Calendly, noreply@, etc.). */
export async function purgeServiceContacts() {
  await hydrateCrm();
  const matches = memoryRecords.filter((contact) => isServiceContactEmail(contact.email));
  for (const contact of matches) {
    await hideAndRemoveContactByEmail(contact.email);
  }
  return matches.length;
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
