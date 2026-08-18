import {
  GhlSyncEvent,
  IntegrationSettings,
  isGhlApiReady,
  isGhlReady,
} from "@/lib/integrations";
import {
  recordGhlSyncEvent,
  updateGhlRuntimeStatus,
} from "@/lib/integrations-store";
import { LeadRecord } from "@/lib/types";

const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";

export type GhlConnectionTest = {
  ok: boolean;
  locationName?: string;
  error?: string;
};

export type GhlSyncResult = {
  status: GhlSyncEvent["status"];
  contactId?: string;
  error?: string;
};

function ghlHeaders(token: string, locationId?: string) {
  const accessToken = token.replace(/^Bearer\s+/i, "").trim();

  return {
    Authorization: `Bearer ${accessToken}`,
    Version: GHL_API_VERSION,
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(locationId ? { "Location-Id": locationId } : {}),
  };
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? fullName.trim();
  const lastName = parts.slice(1).join(" ");

  return { firstName, lastName };
}

function normalizePhone(phone: string) {
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");

  if (!digits) {
    return trimmed;
  }

  return hasPlus ? `+${digits}` : digits;
}

export function uniqueTags(...groups: Array<string | string[] | undefined>) {
  const tags = groups.flatMap((group) => {
    if (!group) {
      return [];
    }

    return (Array.isArray(group) ? group : group.split(","))
      .map((tag) => tag.trim())
      .filter(Boolean);
  });

  return [...new Set(tags)];
}

async function readGhlError(response: Response) {
  const text = await response.text();

  try {
    const json = JSON.parse(text) as {
      message?: string | string[];
      error?: string;
      msg?: string;
    };
    const message = Array.isArray(json.message)
      ? json.message.join(" ")
      : json.message || json.error || json.msg;
    return message || text || `GoHighLevel returned ${response.status}.`;
  } catch {
    return text || `GoHighLevel returned ${response.status}.`;
  }
}

async function ghlRequest<T>(
  path: string,
  settings: Pick<IntegrationSettings, "ghlPrivateToken" | "ghlLocationId">,
  init?: RequestInit,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${GHL_API_BASE}${path}`, {
      ...init,
      headers: {
        ...ghlHeaders(settings.ghlPrivateToken, settings.ghlLocationId),
        ...(init?.headers ?? {}),
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await readGhlError(response));
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("GoHighLevel timed out. Try again in a moment.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function testGhlConnection(
  token: string,
  locationId: string,
): Promise<GhlConnectionTest> {
  try {
    const locationPayload = await ghlRequest<{
      location?: { name?: string; companyName?: string };
      name?: string;
      companyName?: string;
    }>(`/locations/${encodeURIComponent(locationId)}`, {
      ghlPrivateToken: token,
      ghlLocationId: locationId,
    });

    const locationName =
      locationPayload.location?.name ||
      locationPayload.location?.companyName ||
      locationPayload.name ||
      locationPayload.companyName ||
      "JDC Elite Society";

    return { ok: true, locationName };
  } catch (locationError) {
    try {
      await ghlRequest(`/contacts/?locationId=${encodeURIComponent(locationId)}&limit=1`, {
        ghlPrivateToken: token,
        ghlLocationId: locationId,
      });

      return {
        ok: true,
        locationName: "JDC Elite Society",
      };
    } catch {
      return {
        ok: false,
        error:
          locationError instanceof Error
            ? locationError.message
            : "Could not reach the GoHighLevel subaccount.",
      };
    }
  }
}

async function addContactNote(contactId: string, body: string, settings: IntegrationSettings) {
  await ghlRequest(`/contacts/${encodeURIComponent(contactId)}/notes`, settings, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

async function upsertContact(lead: LeadRecord, settings: IntegrationSettings) {
  const { firstName, lastName } = splitName(lead.name);
  const tags = uniqueTags(
    settings.ghlTags,
    lead.tags,
    lead.programInterest,
    lead.source,
    "Website inquiry",
  );

  const payload = await ghlRequest<{
    new?: boolean;
    contact?: { id?: string };
    id?: string;
  }>("/contacts/upsert", settings, {
    method: "POST",
    body: JSON.stringify({
      locationId: settings.ghlLocationId,
      name: lead.name,
      firstName,
      lastName: lastName || undefined,
      email: lead.email,
      phone: normalizePhone(lead.phone),
      address1: lead.address,
      city: lead.city,
      dateOfBirth: lead.dateOfBirth,
      source: "Coach JDC Website",
      tags,
    }),
  });

  const contactId = payload.contact?.id || payload.id;
  if (!contactId) {
    throw new Error("GoHighLevel upserted the contact but did not return an ID.");
  }

  const note = [
    "Website inquiry from coachjdc.org",
    `Program: ${lead.programInterest}`,
    `City: ${lead.city}`,
    `Address: ${lead.address}`,
    `Date of birth: ${lead.dateOfBirth}`,
    lead.assignedPartner ? `Assigned partner: ${lead.assignedPartner}` : null,
    `Source: ${lead.source}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await addContactNote(contactId, note, settings);
  } catch (error) {
    console.error("Failed to add GoHighLevel contact note", error);
  }

  return contactId;
}

async function postInboundWebhook(lead: LeadRecord, webhookUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        leadId: lead.id,
        name: lead.name,
        first_name: splitName(lead.name).firstName,
        last_name: splitName(lead.name).lastName,
        email: lead.email,
        phone: normalizePhone(lead.phone),
        dateOfBirth: lead.dateOfBirth,
        address: lead.address,
        city: lead.city,
        programInterest: lead.programInterest,
        tags: lead.tags,
        source: lead.source,
        assignedPartner: lead.assignedPartner ?? "",
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`GHL webhook returned ${response.status}.`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

export async function syncLeadToGhl(
  lead: LeadRecord,
  settings: IntegrationSettings,
): Promise<GhlSyncResult> {
  if (!isGhlReady(settings)) {
    return {
      status: "skipped",
      error: "GoHighLevel is not connected yet.",
    };
  }

  if (!settings.ghlAutoSync) {
    const result: GhlSyncResult = {
      status: "skipped",
      error: "Automatic GHL sync is turned off.",
    };
    await recordGhlSyncEvent({
      leadId: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      programInterest: lead.programInterest,
      ghlContactId: "",
      status: result.status,
      error: result.error ?? "",
    });
    return result;
  }

  try {
    let contactId = "";

    if (isGhlApiReady(settings)) {
      contactId = await upsertContact(lead, settings);
    }

    if (settings.ghlWebhookUrl) {
      await postInboundWebhook(lead, settings.ghlWebhookUrl);
    }

    const result: GhlSyncResult = { status: "synced", contactId };
    await recordGhlSyncEvent({
      leadId: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      programInterest: lead.programInterest,
      ghlContactId: contactId,
      status: "synced",
      error: "",
    });
    await updateGhlRuntimeStatus({
      ghlLastSyncedAt: new Date().toISOString(),
      ghlLastError: "",
    });
    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "GoHighLevel sync failed.";
    console.error("GoHighLevel lead sync failed", error);
    await recordGhlSyncEvent({
      leadId: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      programInterest: lead.programInterest,
      ghlContactId: "",
      status: "failed",
      error: message,
    });
    await updateGhlRuntimeStatus({
      ghlLastError: message,
    });
    return { status: "failed", error: message };
  }
}
