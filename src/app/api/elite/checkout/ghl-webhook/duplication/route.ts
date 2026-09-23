import { NextResponse } from "next/server";

import { createLead } from "@/lib/crm-store";
import { notifyDuplicationPaymentReceived } from "@/lib/notify";
import { DUPLICATION_PAYMENT_VERIFICATION_TAG, uniqueTags } from "@/lib/tags";

export const dynamic = "force-dynamic";

/**
 * GHL workflow target for the "S2 Duplication Checkout Form" (form id
 * Y1d3jeoR1spHiZQ6Phkb): on Form Submitted, the JDC subaccount should post the
 * contact here so the buyer gets the "payment received, verifying" SMS. Deliberately
 * does NOT create a site account or grant access — GHL owns the pipeline stage and
 * an admin verifies the receipt manually (see the "Repost receipt links" tooling on
 * Dashboard > Integrations), unlike the S1 Building form which grants instant access.
 */

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
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

function pickString(payload: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "elite-checkout-ghl-webhook-duplication" });
}

export async function POST(request: Request) {
  const secret = (process.env.GHL_DUPLICATION_CHECKOUT_WEBHOOK_SECRET ?? process.env.GHL_WEBHOOK_SECRET)?.trim();
  if (secret) {
    const header = request.headers.get("x-webhook-secret") ?? request.headers.get("authorization") ?? "";
    if (!header.includes(secret)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  const payload = await readPayload(request);
  const contact = asRecord(payload.contact);
  const source = Object.keys(contact).length ? contact : payload;

  const email = pickString(source, "email").toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Missing contact email." }, { status: 400 });
  }

  const firstName = pickString(source, "first_name", "firstName");
  const lastName = pickString(source, "last_name", "lastName");
  const fullName = pickString(source, "full_name", "name", "fullName") || `${firstName} ${lastName}`.trim() || email;
  const phone = pickString(source, "phone");

  const tags = uniqueTags(["JDC Mastermind", "jdc-mastermind", "S2 Duplication Checkout Form", DUPLICATION_PAYMENT_VERIFICATION_TAG]);

  try {
    await createLead({
      name: fullName,
      email,
      phone,
      dateOfBirth: "",
      address: "",
      city: "",
      tags,
      bestDescribesYou: "JDC Mastermind Season 2, Duplication buyer",
      programInterest: "JDC Mastermind Season 2 - Duplication",
      source: "S2 Duplication Checkout Form (GHL)",
    });
  } catch (error) {
    console.error("S2 Duplication GHL webhook CRM lead sync failed", error);
  }

  notifyDuplicationPaymentReceived({ name: fullName, email, phone }).catch((error) => {
    console.error("S2 Duplication GHL webhook purchase notice failed", error);
  });

  return NextResponse.json({ ok: true });
}
