import { getResolvedIntegrationSettings } from "@/lib/integrations-store";

export type GhlContactInput = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  bestDescribesYou?: string;
  facebookProfileUrl?: string;
  facebookPhotoUrl?: string;
  source?: string;
  tags?: string[];
};

function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] || name,
    lastName: parts.slice(1).join(" "),
  };
}

export async function syncContactToGhl(input: GhlContactInput) {
  const settings = await getResolvedIntegrationSettings();
  const token = settings.ghlApiKey;
  const locationId = settings.ghlLocationId;

  if (!token || !locationId) {
    return { skipped: true as const, contactId: undefined };
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
    customFields: [
      input.company ? { key: "company", field_value: input.company } : null,
      input.bestDescribesYou
        ? { key: "best_describes_you", field_value: input.bestDescribesYou }
        : null,
      input.facebookPhotoUrl
        ? { key: "facebook_profile_picture", field_value: input.facebookPhotoUrl }
        : null,
      input.facebookProfileUrl
        ? { key: "facebook_profile", field_value: input.facebookProfileUrl }
        : null,
    ].filter(Boolean),
  };

  try {
    const response = await fetch("https://services.leadconnectorhq.com/contacts/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("GHL contact sync failed", response.status, detail);
      const existing = await lookupGhlContact(input.email, input.phone);
      if (existing?.id) {
        await addGhlContactTags(existing.id, tags);
        return { skipped: false as const, ok: true as const, contactId: existing.id };
      }
      return { skipped: false as const, ok: false as const };
    }

    const payload = (await response.json()) as { contact?: { id?: string }; id?: string };
    const contactId = String(payload.contact?.id ?? payload.id ?? "").trim();
    return { skipped: false as const, ok: true as const, contactId: contactId || undefined };
  } catch (error) {
    console.error("GHL contact sync error", error);
    return { skipped: false as const, ok: false as const };
  }
}

export type GhlRemoteContact = {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  source?: string;
  dateAdded?: string;
  tags?: string[];
  type?: string;
  assignedTo?: string;
  profilePhoto?: string;
  latitude?: number | string;
  longitude?: number | string;
  customFields?: Array<{ id?: string; key?: string; field_value?: string; value?: string }>;
};

export function ghlHeaders(token: string, json = false) {
  return {
    Authorization: `Bearer ${token}`,
    Version: "2021-07-28",
    Accept: "application/json",
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

function asContactList(payload: unknown): GhlRemoteContact[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const bags = [record.contacts, record.contact, record.data, record.items];
  const list = bags.find((item) => Array.isArray(item));
  if (Array.isArray(list)) {
    return list as GhlRemoteContact[];
  }

  const nested = record.contacts;
  if (nested && typeof nested === "object" && Array.isArray((nested as { contacts?: unknown }).contacts)) {
    return (nested as { contacts: GhlRemoteContact[] }).contacts;
  }

  return [];
}

export async function listGhlLocationContacts() {
  const settings = await getResolvedIntegrationSettings();
  const token = settings.ghlApiKey;
  const locationId = settings.ghlLocationId;

  if (!token || !locationId) {
    return { skipped: true as const, contacts: [] as GhlRemoteContact[] };
  }

  const contacts: GhlRemoteContact[] = [];
  const seen = new Set<string>();

  const addPage = (page: GhlRemoteContact[]) => {
    for (const contact of page) {
      const id = String(contact.id ?? "").trim();
      if (!id || seen.has(id)) {
        continue;
      }
      seen.add(id);
      contacts.push(contact);
    }
    return page.length;
  };

  try {
    for (let page = 1; page <= 20; page += 1) {
      const response = await fetch("https://services.leadconnectorhq.com/contacts/search", {
        method: "POST",
        headers: ghlHeaders(token, true),
        cache: "no-store",
        body: JSON.stringify({
          locationId,
          page,
          pageLimit: 100,
        }),
      });

      if (!response.ok) {
        break;
      }

      const payload = (await response.json()) as unknown;
      const count = addPage(asContactList(payload));
      if (count < 100) {
        return { skipped: false as const, contacts };
      }
    }

    if (contacts.length > 0) {
      return { skipped: false as const, contacts };
    }

    let startAfterId = "";
    for (let page = 0; page < 20; page += 1) {
      const query = new URLSearchParams({ locationId, limit: "100" });
      if (startAfterId) {
        query.set("startAfterId", startAfterId);
      }
      const response = await fetch(`https://services.leadconnectorhq.com/contacts/?${query.toString()}`, {
        headers: ghlHeaders(token),
        cache: "no-store",
      });
      if (!response.ok) {
        break;
      }
      const payload = (await response.json()) as unknown;
      const pageContacts = asContactList(payload);
      addPage(pageContacts);
      const last = pageContacts[pageContacts.length - 1];
      if (!last?.id || pageContacts.length < 100) {
        break;
      }
      startAfterId = String(last.id);
    }

    return { skipped: false as const, contacts };
  } catch (error) {
    console.error("GHL contact list failed", error);
    return { skipped: false as const, contacts };
  }
}

export async function searchGhlContactsByTags(tags: string[]) {
  const settings = await getResolvedIntegrationSettings();
  const token = settings.ghlApiKey;
  const locationId = settings.ghlLocationId;
  const wanted = [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];

  if (!token || !locationId || wanted.length === 0) {
    return [] as GhlRemoteContact[];
  }

  const contacts: GhlRemoteContact[] = [];
  const seen = new Set<string>();

  const addPage = (page: GhlRemoteContact[]) => {
    for (const contact of page) {
      const id = String(contact.id ?? "").trim();
      if (!id || seen.has(id)) {
        continue;
      }
      seen.add(id);
      contacts.push(contact);
    }
    return page.length;
  };

  for (const tag of wanted) {
    try {
      for (let page = 1; page <= 20; page += 1) {
        const response = await fetch("https://services.leadconnectorhq.com/contacts/search", {
          method: "POST",
          headers: ghlHeaders(token, true),
          cache: "no-store",
          body: JSON.stringify({
            locationId,
            page,
            pageLimit: 100,
            filters: [{ field: "tags", operator: "eq", value: tag }],
          }),
        });
        if (!response.ok) {
          break;
        }

        const payload = (await response.json()) as unknown;
        if (addPage(asContactList(payload)) < 100) {
          break;
        }
      }
    } catch (error) {
      console.error("GHL tag search failed", tag, error);
    }
  }

  return contacts;
}

export async function listGhlLocationTags() {
  const settings = await getResolvedIntegrationSettings();
  const token = settings.ghlApiKey;
  const locationId = settings.ghlLocationId;

  if (!token || !locationId) {
    return [] as string[];
  }

  try {
    const response = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}/tags`, {
      headers: ghlHeaders(token),
      cache: "no-store",
    });
    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as Record<string, unknown>;
    const bags = [payload.tags, payload.data];
    const list = bags.find((item) => Array.isArray(item)) as Array<{ name?: string; tag?: string }> | undefined;
    return (list ?? [])
      .map((item) => String(item.name ?? item.tag ?? "").trim())
      .filter(Boolean);
  } catch (error) {
    console.error("GHL tags list failed", error);
    return [];
  }
}

export async function addGhlContactTags(contactId: string, tags: string[]) {
  const settings = await getResolvedIntegrationSettings();
  const token = settings.ghlApiKey;
  if (!token || !contactId || tags.length === 0) {
    return { skipped: true as const };
  }

  try {
    const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/tags`, {
      method: "POST",
      headers: ghlHeaders(token, true),
      body: JSON.stringify({ tags }),
    });
    if (!response.ok) {
      console.error("GHL add tags failed", response.status, await response.text());
      return { skipped: false as const, ok: false as const };
    }
    return { skipped: false as const, ok: true as const };
  } catch (error) {
    console.error("GHL add tags error", error);
    return { skipped: false as const, ok: false as const };
  }
}

export async function removeGhlContactTags(contactId: string, tags: string[]) {
  const settings = await getResolvedIntegrationSettings();
  const token = settings.ghlApiKey;
  if (!token || !contactId || tags.length === 0) {
    return { skipped: true as const };
  }

  try {
    const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/tags`, {
      method: "DELETE",
      headers: ghlHeaders(token, true),
      body: JSON.stringify({ tags }),
    });
    if (!response.ok) {
      console.error("GHL remove tags failed", response.status, await response.text());
      return { skipped: false as const, ok: false as const };
    }
    return { skipped: false as const, ok: true as const };
  } catch (error) {
    console.error("GHL remove tags error", error);
    return { skipped: false as const, ok: false as const };
  }
}

export async function lookupGhlContact(email?: string, phone?: string) {
  const settings = await getResolvedIntegrationSettings();
  const token = settings.ghlApiKey;
  const locationId = settings.ghlLocationId;
  if (!token || !locationId || (!email && !phone)) {
    return null;
  }

  const query = new URLSearchParams({ locationId });
  if (email) query.set("email", email);
  if (phone) query.set("phone", phone);

  try {
    const response = await fetch(`https://services.leadconnectorhq.com/contacts/lookup?${query.toString()}`, {
      headers: ghlHeaders(token),
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    const payload = (await response.json()) as { contact?: GhlRemoteContact; contacts?: GhlRemoteContact[] };
    return payload.contact ?? payload.contacts?.[0] ?? null;
  } catch (error) {
    console.error("GHL contact lookup failed", error);
    return null;
  }
}

export async function getGhlContactById(contactId: string) {
  const settings = await getResolvedIntegrationSettings();
  const token = settings.ghlApiKey;
  if (!token || !contactId) {
    return null;
  }

  try {
    const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
      headers: ghlHeaders(token),
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    const payload = (await response.json()) as { contact?: GhlRemoteContact };
    return payload.contact ?? null;
  } catch (error) {
    console.error("GHL contact fetch failed", error);
    return null;
  }
}

export async function sendGhlSms(contactId: string, message: string) {
  const settings = await getResolvedIntegrationSettings();
  const token = settings.ghlApiKey;
  if (!token || !contactId || !message.trim()) {
    return { skipped: true as const, ok: false as const };
  }

  try {
    const response = await fetch("https://services.leadconnectorhq.com/conversations/messages", {
      method: "POST",
      headers: ghlHeaders(token, true),
      body: JSON.stringify({
        type: "SMS",
        contactId,
        message,
      }),
    });
    if (!response.ok) {
      console.error("GHL SMS failed", response.status, await response.text());
      return { skipped: false as const, ok: false as const };
    }
    return { skipped: false as const, ok: true as const };
  } catch (error) {
    console.error("GHL SMS error", error);
    return { skipped: false as const, ok: false as const };
  }
}

export async function scheduleGhlMessage(input: {
  type: "Email" | "SMS";
  contactId: string;
  message: string;
  scheduledAt: string;
  subject?: string;
  html?: string;
  emailTo?: string;
  toNumber?: string;
}) {
  const settings = await getResolvedIntegrationSettings();
  const token = settings.ghlApiKey;
  if (!token || !input.contactId || new Date(input.scheduledAt).getTime() <= Date.now()) {
    return { skipped: true as const, ok: false as const };
  }

  try {
    const response = await fetch("https://services.leadconnectorhq.com/conversations/messages", {
      method: "POST",
      headers: ghlHeaders(token, true),
      body: JSON.stringify({
        type: input.type,
        contactId: input.contactId,
        message: input.message,
        subject: input.subject,
        html: input.html,
        emailTo: input.emailTo,
        toNumber: input.toNumber,
        scheduledTimestamp: Math.floor(new Date(input.scheduledAt).getTime() / 1000),
        status: "pending",
      }),
    });
    if (!response.ok) {
      console.error("GHL scheduled message failed", response.status, await response.text());
      return { skipped: false as const, ok: false as const };
    }
    const payload = (await response.json()) as { messageId?: string; emailMessageId?: string };
    return { skipped: false as const, ok: true as const, messageId: payload.messageId ?? payload.emailMessageId ?? "" };
  } catch (error) {
    console.error("GHL scheduled message error", error);
    return { skipped: false as const, ok: false as const };
  }
}
