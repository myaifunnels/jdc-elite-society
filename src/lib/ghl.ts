import { customFieldValue, formatContactFieldValue, labelFromKey, normalizeContact } from "@/lib/contact-fields";
import {
  deleteContactByGhlId,
  getGhlSyncState,
  listCustomFieldDefs,
  replaceCustomFieldDefs,
  replaceGhlMirror,
  saveGhlSyncState,
  upsertContact,
  type GhlCustomFieldDef,
} from "@/lib/crm-store";
import { getResolvedIntegrationSettings } from "@/lib/integrations-store";
import { ContactCustomField, ContactFieldValue, ContactKind, ContactRecord, ContactStatus } from "@/lib/types";

export type GhlContactInput = {
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  bestDescribesYou?: string;
  facebookProfileUrl?: string;
  facebookPhotoUrl?: string;
  source?: string;
  tags?: string[];
};

type GhlCustomFieldRaw = {
  id?: string;
  key?: string;
  fieldKey?: string;
  field_key?: string;
  name?: string;
  dataType?: string;
  data_type?: string;
  model?: string;
  value?: unknown;
  fieldValue?: unknown;
  field_value?: unknown;
};

type GhlContactRaw = {
  id?: string;
  locationId?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  firstNameRaw?: string;
  lastNameRaw?: string;
  email?: string;
  phone?: string;
  additionalEmails?: unknown;
  additionalPhones?: unknown;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  companyName?: string;
  website?: string;
  timezone?: string;
  dnd?: boolean;
  type?: string;
  source?: string;
  assignedTo?: string;
  dateOfBirth?: string;
  dateAdded?: string;
  dateUpdated?: string;
  tags?: unknown;
  customFields?: GhlCustomFieldRaw[];
  profilePhoto?: string;
  businessName?: string;
  [key: string]: unknown;
};

const GHL_API = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";
const SKIP_STANDARD_KEYS = new Set([
  "customFields",
  "attributions",
  "followers",
  "opportunities",
  "conversations",
  "locationId",
]);

let mirrorInFlight: Promise<{ ok: boolean; count: number; error?: string }> | null = null;

function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] || name,
    lastName: parts.slice(1).join(" "),
  };
}

function asStringArray(value: unknown) {
  if (!value) {
    return [] as string[];
  }
  if (Array.isArray(value)) {
    return value.map((item) => formatContactFieldValue(item)).filter(Boolean);
  }
  const text = formatContactFieldValue(value);
  return text ? [text] : [];
}

async function ghlRequest(token: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`${GHL_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Version: GHL_VERSION,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
  }
  return { response, json, text };
}

function readCustomFieldValue(field: GhlCustomFieldRaw) {
  return formatContactFieldValue(field.value ?? field.fieldValue ?? field.field_value);
}

function inferKind(tags: string[], type?: string): ContactKind {
  const hay = [...tags, type ?? ""].join(" ").toLowerCase();
  return hay.includes("partner") ? "partner" : "contact";
}

function inferStatus(tags: string[], type?: string): ContactStatus {
  const hay = [...tags, type ?? ""].join(" ").toLowerCase();
  if (/\b(won|closed|customer|member)\b/.test(hay)) {
    return "won";
  }
  if (hay.includes("follow")) {
    return "follow-up";
  }
  if (hay.includes("qualified")) {
    return "qualified";
  }
  if (hay.includes("ramping")) {
    return "ramping";
  }
  if (hay.includes("active") || hay.includes("partner")) {
    return "active";
  }
  return "new";
}

function mapStandardFields(raw: GhlContactRaw): ContactFieldValue[] {
  const fields: ContactFieldValue[] = [];
  const seen = new Set<string>();

  const push = (key: string, value: unknown) => {
    if (seen.has(key) || SKIP_STANDARD_KEYS.has(key)) {
      return;
    }
    const formatted = formatContactFieldValue(value);
    if (!formatted) {
      return;
    }
    seen.add(key);
    fields.push({ key, label: labelFromKey(key), value: formatted });
  };

  const preferred = [
    "id",
    "firstName",
    "lastName",
    "name",
    "email",
    "phone",
    "additionalEmails",
    "additionalPhones",
    "dateOfBirth",
    "companyName",
    "website",
    "address1",
    "city",
    "state",
    "postalCode",
    "country",
    "timezone",
    "source",
    "type",
    "assignedTo",
    "dnd",
    "tags",
    "dateAdded",
    "dateUpdated",
    "profilePhoto",
    "businessName",
  ];

  for (const key of preferred) {
    push(key, raw[key]);
  }

  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "function") {
      continue;
    }
    push(key, value);
  }

  return fields;
}

function mapCustomFields(raw: GhlContactRaw, defs: GhlCustomFieldDef[]): ContactCustomField[] {
  const byId = new Map(defs.map((def) => [def.id, def]));
  const byKey = new Map(defs.map((def) => [def.fieldKey, def]));

  return (raw.customFields ?? []).map((field, index) => {
    const id = String(field.id || field.key || `custom-${index}`);
    const key = String(field.fieldKey || field.field_key || field.key || "");
    const def = byId.get(id) || byKey.get(key);
    return {
      id,
      key: def?.fieldKey || key || id,
      label: def?.name || field.name || labelFromKey(key || id),
      dataType: def?.dataType || field.dataType || field.data_type || "",
      value: readCustomFieldValue(field),
    };
  });
}

export function mapGhlContact(raw: GhlContactRaw, defs: GhlCustomFieldDef[] = []): ContactRecord {
  const tags = asStringArray(raw.tags);
  const customFields = mapCustomFields(raw, defs);
  const firstName = String(raw.firstName || raw.firstNameRaw || "").trim();
  const lastName = String(raw.lastName || raw.lastNameRaw || "").trim();
  const name = String(raw.name || `${firstName} ${lastName}`.trim() || raw.email || "Unnamed contact");
  const address = [raw.address1, raw.city, raw.state, raw.postalCode, raw.country].filter(Boolean).join(", ");
  const ghlId = String(raw.id || "");
  const photoUrl =
    String(raw.profilePhoto || "") ||
    customFieldValue(customFields, "facebook_profile_picture", "facebook photo", "profile photo");

  return normalizeContact({
    id: ghlId ? `ghl-${ghlId}` : `contact-${Date.now()}`,
    ghlId: ghlId || undefined,
    syncedFromGhl: true,
    kind: inferKind(tags, String(raw.type || "")),
    name,
    firstName,
    lastName,
    email: String(raw.email || ""),
    phone: String(raw.phone || ""),
    additionalEmails: asStringArray(raw.additionalEmails),
    additionalPhones: asStringArray(raw.additionalPhones),
    dateOfBirth: String(raw.dateOfBirth || ""),
    address,
    city: String(raw.city || ""),
    state: String(raw.state || ""),
    postalCode: String(raw.postalCode || ""),
    country: String(raw.country || ""),
    region: String(raw.state || raw.country || raw.city || ""),
    companyName: String(raw.companyName || raw.businessName || ""),
    website: String(raw.website || ""),
    timezone: String(raw.timezone || ""),
    tags,
    bestDescribesYou:
      customFieldValue(customFields, "best_describes_you", "best describes you") ||
      tags.find((tag) => /ofw|employee|entrepreneur|business|professional/i.test(tag)) ||
      "",
    programInterest:
      customFieldValue(customFields, "program_interest", "program interest") ||
      tags.find((tag) => /program|mindset|spartan|jes|retirement|business/i.test(tag)) ||
      "",
    status: inferStatus(tags, String(raw.type || "")),
    source: String(raw.source || "GoHighLevel"),
    assignedPartner: customFieldValue(customFields, "assigned_partner", "assigned partner") || undefined,
    assignedTo: String(raw.assignedTo || ""),
    dnd: Boolean(raw.dnd),
    photoUrl: photoUrl || undefined,
    facebookProfileUrl:
      customFieldValue(customFields, "facebook_profile", "facebook url") || String(raw.website || "") || undefined,
    standardFields: mapStandardFields(raw),
    customFields,
    createdAt: String(raw.dateAdded || new Date().toISOString()).slice(0, 10),
    updatedAt: String(raw.dateUpdated || new Date().toISOString()),
  });
}

async function credentials() {
  const settings = await getResolvedIntegrationSettings();
  return {
    token: settings.ghlApiKey,
    locationId: settings.ghlLocationId,
  };
}

export async function fetchGhlCustomFieldDefs(token: string, locationId: string): Promise<GhlCustomFieldDef[]> {
  const { response, json } = await ghlRequest(
    token,
    `/locations/${encodeURIComponent(locationId)}/customFields?model=contact`,
  );

  if (!response.ok) {
    const fallback = await ghlRequest(token, `/locations/${encodeURIComponent(locationId)}/customFields`);
    if (!fallback.response.ok) {
      console.error("GHL custom fields fetch failed", response.status, json);
      return listCustomFieldDefs();
    }
    return mapCustomFieldDefs(fallback.json, locationId);
  }

  return mapCustomFieldDefs(json, locationId);
}

function mapCustomFieldDefs(json: unknown, locationId: string): GhlCustomFieldDef[] {
  const payload = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  const list = (payload.customFields ?? payload.fields ?? payload) as unknown;
  const rows = Array.isArray(list) ? list : [];

  return rows
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const row = item as GhlCustomFieldRaw & Record<string, unknown>;
      const id = String(row.id || "");
      if (!id) {
        return null;
      }
      return {
        id,
        locationId,
        name: String(row.name || labelFromKey(String(row.fieldKey || row.key || id))),
        fieldKey: String(row.fieldKey || row.field_key || row.key || ""),
        dataType: String(row.dataType || row.data_type || "TEXT"),
        model: String(row.model || "contact"),
        payload: row,
      } satisfies GhlCustomFieldDef;
    })
    .filter((item): item is GhlCustomFieldDef => Boolean(item));
}

async function fetchGhlContactsPage(token: string, locationId: string, page: number, startAfterId?: string) {
  const { response, json, text } = await ghlRequest(token, "/contacts/search", {
    method: "POST",
    body: JSON.stringify({
      locationId,
      page,
      pageLimit: 100,
    }),
  });

  if (response.ok) {
    const payload = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
    const contacts = Array.isArray(payload.contacts) ? (payload.contacts as GhlContactRaw[]) : [];
    const total = Number(payload.total ?? contacts.length);
    return { contacts, total, startAfterId: undefined as string | undefined, usedSearch: true };
  }

  const params = new URLSearchParams({ locationId, limit: "100" });
  if (startAfterId) {
    params.set("startAfterId", startAfterId);
  }
  const fallback = await ghlRequest(token, `/contacts/?${params.toString()}`);
  if (!fallback.response.ok) {
    throw new Error(`GHL contact search failed (${response.status}): ${text.slice(0, 400)}`);
  }

  const payload = fallback.json && typeof fallback.json === "object" ? (fallback.json as Record<string, unknown>) : {};
  const contacts = Array.isArray(payload.contacts) ? (payload.contacts as GhlContactRaw[]) : [];
  const meta = payload.meta && typeof payload.meta === "object" ? (payload.meta as Record<string, unknown>) : {};
  return {
    contacts,
    total: Number(payload.total ?? meta.total ?? contacts.length),
    startAfterId: typeof meta.startAfterId === "string" ? meta.startAfterId : undefined,
    usedSearch: false,
  };
}

export async function fetchGhlContactById(token: string, contactId: string) {
  const { response, json } = await ghlRequest(token, `/contacts/${encodeURIComponent(contactId)}`);
  if (!response.ok) {
    return null;
  }
  const payload = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  const contact = (payload.contact ?? payload) as GhlContactRaw;
  return contact.id ? contact : null;
}

export async function mirrorGhlContacts(options: { force?: boolean } = {}) {
  if (mirrorInFlight) {
    return mirrorInFlight;
  }

  mirrorInFlight = (async () => {
    const { token, locationId } = await credentials();
    if (!token || !locationId) {
      return { ok: false, count: 0, error: "GoHighLevel is not connected." };
    }

    try {
      const defs = await fetchGhlCustomFieldDefs(token, locationId);
      await replaceCustomFieldDefs(defs);

      const contacts: ContactRecord[] = [];
      let page = 1;
      let startAfterId: string | undefined;

      while (page <= 50) {
        const result = await fetchGhlContactsPage(token, locationId, page, startAfterId);
        contacts.push(...result.contacts.map((contact) => mapGhlContact(contact, defs)));
        if (result.contacts.length < 100) {
          break;
        }
        if (!result.usedSearch) {
          if (!result.startAfterId || result.startAfterId === startAfterId) {
            break;
          }
          startAfterId = result.startAfterId;
        } else if (result.total && contacts.length >= result.total) {
          break;
        }
        page += 1;
      }

      const count = await replaceGhlMirror(contacts);
      await saveGhlSyncState({
        lastSyncedAt: new Date().toISOString(),
        lastError: null,
        contactCount: count,
      });
      return { ok: true, count };
    } catch (error) {
      const message = error instanceof Error ? error.message : "GHL mirror failed.";
      console.error("GHL contact mirror failed", error);
      await saveGhlSyncState({ lastError: message });
      return { ok: false, count: 0, error: message };
    }
  })().finally(() => {
    mirrorInFlight = null;
  });

  void options;
  return mirrorInFlight;
}

export async function maybeRefreshGhlMirror(maxAgeMs = 10 * 60 * 1000) {
  const { token, locationId } = await credentials();
  if (!token || !locationId) {
    return { skipped: true as const };
  }

  const state = await getGhlSyncState();
  const syncedAt = state.lastSyncedAt ? Date.parse(state.lastSyncedAt) : 0;
  if (syncedAt && Date.now() - syncedAt < maxAgeMs) {
    return { skipped: true as const };
  }

  return { skipped: false as const, ...(await mirrorGhlContacts()) };
}

export async function upsertGhlContactFromPayload(raw: GhlContactRaw | null, contactId?: string) {
  const { token, locationId } = await credentials();
  if (!token || !locationId) {
    return null;
  }

  const defs = (await listCustomFieldDefs()).length
    ? await listCustomFieldDefs()
    : await fetchGhlCustomFieldDefs(token, locationId);
  const full = contactId ? ((await fetchGhlContactById(token, contactId)) ?? raw) : raw;
  if (!full?.id) {
    return null;
  }

  const mapped = mapGhlContact(full, defs);
  return upsertContact(mapped);
}

export async function handleGhlWebhook(body: Record<string, unknown>) {
  const type = String(body.type ?? body.event ?? "");
  const contactPayload = (body.contact && typeof body.contact === "object" ? body.contact : body) as GhlContactRaw;
  const contactId = String(body.contactId ?? contactPayload.id ?? body.id ?? "");

  if (/delete/i.test(type) && contactId) {
    await deleteContactByGhlId(contactId);
    const state = await getGhlSyncState();
    await saveGhlSyncState({ contactCount: Math.max(0, state.contactCount - 1) });
    return { ok: true, action: "deleted" as const };
  }

  if (contactId || contactPayload.email) {
    await upsertGhlContactFromPayload(contactPayload, contactId || undefined);
    return { ok: true, action: "upserted" as const };
  }

  return { ok: false, action: "ignored" as const };
}

async function customFieldWritePayload(
  token: string,
  locationId: string,
  entries: { key: string; value: string }[],
) {
  const defs = await fetchGhlCustomFieldDefs(token, locationId);
  return entries
    .filter((entry) => entry.value)
    .map((entry) => {
      const def =
        defs.find((item) => item.fieldKey === entry.key) ||
        defs.find((item) => item.fieldKey.replace(/[^a-z0-9]/gi, "") === entry.key.replace(/[^a-z0-9]/gi, "")) ||
        defs.find((item) => item.name.toLowerCase().replace(/[^a-z0-9]/g, "") === entry.key.replace(/[^a-z0-9]/g, ""));
      if (def) {
        return { id: def.id, key: def.fieldKey || entry.key, field_value: entry.value };
      }
      return { key: entry.key, field_value: entry.value };
    });
}

export async function syncContactToGhl(input: GhlContactInput) {
  const { token, locationId } = await credentials();

  if (!token || !locationId) {
    return { skipped: true as const };
  }

  const { firstName, lastName } = splitName(input.name);
  const tags = Array.from(
    new Set(
      [
        "JDC Elite Society",
        "Website",
        input.source ?? "Website registration",
        input.bestDescribesYou ?? "",
        ...(input.tags ?? []),
      ].filter(Boolean),
    ),
  );

  const customFields = await customFieldWritePayload(token, locationId, [
    { key: "best_describes_you", value: input.bestDescribesYou ?? "" },
    { key: "facebook_profile_picture", value: input.facebookPhotoUrl ?? "" },
    { key: "facebook_profile", value: input.facebookProfileUrl ?? "" },
  ]);

  const body = {
    locationId,
    firstName,
    lastName,
    email: input.email,
    phone: input.phone || undefined,
    dateOfBirth: input.dateOfBirth || undefined,
    address1: input.address || undefined,
    city: input.city || undefined,
    website: input.facebookProfileUrl || undefined,
    source: input.source || "JDC Elite Society website",
    tags,
    customFields,
  };

  try {
    const { response, json, text } = await ghlRequest(token, "/contacts/", {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const searched = await ghlRequest(token, "/contacts/search", {
        method: "POST",
        body: JSON.stringify({
          locationId,
          page: 1,
          pageLimit: 1,
          query: input.email,
        }),
      });
      const payload = searched.json && typeof searched.json === "object" ? (searched.json as Record<string, unknown>) : {};
      const existing = Array.isArray(payload.contacts) ? (payload.contacts[0] as GhlContactRaw | undefined) : undefined;

      if (existing?.id) {
        const updated = await ghlRequest(token, `/contacts/${encodeURIComponent(existing.id)}`, {
          method: "PUT",
          body: JSON.stringify({
            firstName,
            lastName,
            email: input.email,
            phone: input.phone || undefined,
            dateOfBirth: input.dateOfBirth || undefined,
            address1: input.address || undefined,
            city: input.city || undefined,
            website: input.facebookProfileUrl || undefined,
            source: input.source || "JDC Elite Society website",
            tags,
            customFields,
          }),
        });
        const updatedContact =
          updated.json && typeof updated.json === "object"
            ? ((updated.json as Record<string, unknown>).contact as GhlContactRaw | undefined) ?? existing
            : existing;
        if (updatedContact) {
          const defs = await listCustomFieldDefs();
          await upsertContact(mapGhlContact({ ...updatedContact, ...body, id: existing.id }, defs));
        }
        return { skipped: false as const, ok: updated.response.ok };
      }

      console.error("GHL contact sync failed", response.status, text);
      return { skipped: false as const, ok: false as const };
    }

    const created =
      json && typeof json === "object" ? ((json as Record<string, unknown>).contact as GhlContactRaw | undefined) : undefined;
    if (created?.id) {
      const defs = await listCustomFieldDefs();
      await upsertContact(mapGhlContact({ ...created, ...body, id: created.id }, defs));
    }

    return { skipped: false as const, ok: true as const };
  } catch (error) {
    console.error("GHL contact sync error", error);
    return { skipped: false as const, ok: false as const };
  }
}
