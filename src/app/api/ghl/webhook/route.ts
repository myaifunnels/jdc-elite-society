import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { ingestGhlContactById, ingestGhlRemoteContact, invalidateGhlContactSync } from "@/lib/crm-store";
import { getGhlContactById, lookupGhlContact, type GhlRemoteContact } from "@/lib/ghl";
import { getResolvedIntegrationSettings } from "@/lib/integrations-store";

export const dynamic = "force-dynamic";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asTags(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag)).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return undefined;
}

function pickContact(payload: Record<string, unknown>): GhlRemoteContact | null {
  const nested = asRecord(payload.contact);
  const source = Object.keys(nested).length ? nested : payload;
  const id = String(source.id ?? source.contactId ?? payload.contactId ?? payload.id ?? "").trim();
  const email = String(source.email ?? payload.email ?? "").trim();
  if (!id && !email) {
    return null;
  }

  const tags = asTags(source.tags ?? payload.tags);

  return {
    id: id || email,
    firstName: String(source.firstName ?? source.first_name ?? ""),
    lastName: String(source.lastName ?? source.last_name ?? ""),
    name: String(source.name ?? ""),
    email,
    phone: String(source.phone ?? ""),
    tags,
  };
}

async function readPayload(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await request.formData();
    const payload: Record<string, unknown> = {};
    form.forEach((value, key) => {
      payload[key] = typeof value === "string" ? value : value.name;
    });
    return payload;
  }

  try {
    return asRecord(await request.json());
  } catch {
    return {};
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "ghl-pipeline-webhook" });
}

export async function POST(request: Request) {
  const settings = await getResolvedIntegrationSettings();
  const secret = process.env.GHL_WEBHOOK_SECRET?.trim();
  if (secret) {
    const header = request.headers.get("x-webhook-secret") ?? request.headers.get("authorization") ?? "";
    if (!header.includes(secret)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  const payload = await readPayload(request);
  const locationId = String(payload.locationId ?? payload.location_id ?? "").trim();
  if (settings.ghlLocationId && locationId && locationId !== settings.ghlLocationId) {
    return NextResponse.json({ skipped: true, reason: "location" });
  }

  invalidateGhlContactSync();
  const incoming = pickContact(payload);
  let stored = null;

  const contactId = String(incoming?.id ?? payload.contactId ?? "").trim();
  if (contactId && !contactId.includes("@")) {
    const remote = await getGhlContactById(contactId);
    if (remote) {
      stored = await ingestGhlRemoteContact({
        ...remote,
        tags: incoming?.tags ?? remote.tags,
      });
    } else {
      stored = await ingestGhlContactById(contactId);
    }
  }
  if (!stored && incoming?.email) {
    const remote = (await lookupGhlContact(incoming.email, incoming.phone)) ?? incoming;
    stored = await ingestGhlRemoteContact({ ...remote, tags: incoming.tags ?? remote.tags });
  }
  if (!stored && incoming) {
    stored = await ingestGhlRemoteContact(incoming);
  }
  if (!stored && contactId) {
    const remote = await getGhlContactById(contactId);
    if (remote) {
      stored = await ingestGhlRemoteContact(remote);
    }
  }

  revalidatePath("/dashboard/pipeline");
  revalidatePath("/dashboard/contacts");
  return NextResponse.json({ ok: true, ingested: Boolean(stored), id: stored?.id ?? null });
}
