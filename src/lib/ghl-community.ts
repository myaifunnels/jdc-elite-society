import { COURSE_ACCESS_TAGS, uniqueTags } from "@/lib/tags";
import { addGhlContactTags, lookupGhlContact, syncContactToGhl } from "@/lib/ghl";
import { getResolvedIntegrationSettings } from "@/lib/integrations-store";

type Json = Record<string, unknown>;

function ghlHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Version: "2021-07-28",
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function walk(value: unknown, visit: (node: Json) => void, seen = new Set<unknown>()) {
  if (!value || typeof value !== "object" || seen.has(value)) {
    return;
  }
  seen.add(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      walk(item, visit, seen);
    }
    return;
  }
  visit(value as Json);
  for (const child of Object.values(value)) {
    walk(child, visit, seen);
  }
}

const MASTERMIND_NEEDLES = [
  "jdc mastermind session 1",
  "jdc mastermind session 2",
  "mastermind session 1",
  "mastermind session 2",
  "jdc mastermind",
];

const COMMUNITY_NEEDLES = ["jdc elite", "elite society", "mastermind", "university", "community", "jes"];

function matchesNeedles(name: string, needles: string[]) {
  const normalized = name.toLowerCase();
  return needles.some((needle) => normalized.includes(needle));
}

function nodeId(node: Json) {
  return text(node.id || node._id || node.offerId || node.groupId || node.productId || node.value);
}

function nodeName(node: Json) {
  return text(node.name || node.title || node.label || node.offerName || node.groupName);
}

async function fetchJson(url: string, token: string, init?: RequestInit) {
  try {
    const response = await fetch(url, {
      ...init,
      headers: { ...ghlHeaders(token), ...(init?.headers ?? {}) },
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null);
    return { ok: response.ok, status: response.status, payload };
  } catch (error) {
    console.error("GHL community request failed", url, error);
    return { ok: false, status: 0, payload: null as unknown };
  }
}

async function collectCatalog(token: string, locationId: string) {
  const query = new URLSearchParams({ locationId, limit: "100" });
  const urls = [
    `https://services.leadconnectorhq.com/memberships/?${query}`,
    `https://services.leadconnectorhq.com/memberships/offers?${query}`,
    `https://services.leadconnectorhq.com/memberships/courses?${query}`,
    `https://services.leadconnectorhq.com/communities/?${query}`,
    `https://services.leadconnectorhq.com/communities/groups?${query}`,
    `https://services.leadconnectorhq.com/communities/groups/list?${query}`,
  ];
  const items: Array<{ id: string; name: string; kind: "offer" | "group" }> = [];
  const seen = new Set<string>();

  for (const url of urls) {
    const { payload } = await fetchJson(url, token);
    walk(payload, (node) => {
      const id = nodeId(node);
      const name = nodeName(node);
      if (!id || !name || seen.has(id)) {
        return;
      }
      const isGroup =
        Boolean(node.groupId || node.channelId) ||
        text(node.type).toLowerCase().includes("group") ||
        url.includes("/communities");
      seen.add(id);
      items.push({ id, name, kind: isGroup ? "group" : "offer" });
    });
  }

  return items;
}

async function grantItem(input: {
  token: string;
  locationId: string;
  contactId: string;
  email: string;
  item: { id: string; name: string; kind: "offer" | "group" };
}) {
  const { token, locationId, contactId, email, item } = input;
  const bodies: Array<{ url: string; body: Json }> = [
    {
      url: "https://services.leadconnectorhq.com/memberships/users",
      body: { locationId, contactId, email, offerId: item.id, offerIds: [item.id] },
    },
    {
      url: "https://services.leadconnectorhq.com/v1/users/memberships/grant",
      body: { locationId, contactId, offerId: item.id },
    },
    {
      url: `https://services.leadconnectorhq.com/contacts/${contactId}/memberships`,
      body: { locationId, offerId: item.id, offerIds: [item.id] },
    },
    {
      url: `https://services.leadconnectorhq.com/communities/groups/${item.id}/members`,
      body: { locationId, contactId, email },
    },
    {
      url: `https://services.leadconnectorhq.com/communities/groups/${item.id}/contacts`,
      body: { locationId, contactId, email },
    },
  ];

  for (const attempt of bodies) {
    if (item.kind === "offer" && attempt.url.includes("/communities/groups/")) {
      continue;
    }
    const result = await fetchJson(attempt.url, token, {
      method: "POST",
      body: JSON.stringify(attempt.body),
    });
    if (result.ok || result.status === 409) {
      return true;
    }
  }
  return false;
}

export async function grantCommunityAndMastermindAccess(input: {
  name: string;
  email: string;
  phone?: string;
  extraTags?: string[];
}) {
  const settings = await getResolvedIntegrationSettings();
  const tags = uniqueTags([...COURSE_ACCESS_TAGS, "University access", "community-member", ...(input.extraTags ?? [])]);

  const synced = await syncContactToGhl({
    name: input.name,
    email: input.email,
    phone: input.phone,
    source: "University access grant",
    tags,
  });
  const existing = synced.contactId ? { id: synced.contactId } : await lookupGhlContact(input.email, input.phone);
  const contactId = existing?.id;
  if (contactId) {
    await addGhlContactTags(contactId, tags);
  }

  if (!settings.ghlApiKey || !settings.ghlLocationId || !contactId) {
    return { contactId, tags, granted: 0 };
  }

  const catalog = await collectCatalog(settings.ghlApiKey, settings.ghlLocationId);
  const selected = catalog.filter((item) =>
    item.kind === "group"
      ? matchesNeedles(item.name, COMMUNITY_NEEDLES)
      : matchesNeedles(item.name, MASTERMIND_NEEDLES) || matchesNeedles(item.name, COMMUNITY_NEEDLES),
  );

  let granted = 0;
  for (const item of selected) {
    const ok = await grantItem({
      token: settings.ghlApiKey,
      locationId: settings.ghlLocationId,
      contactId,
      email: input.email,
      item,
    });
    if (ok) {
      granted += 1;
    }
  }

  return { contactId, tags, granted };
}
