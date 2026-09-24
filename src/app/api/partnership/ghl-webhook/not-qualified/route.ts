import { NextResponse } from "next/server";

import { checkWebhookSecret, contactFromPayload, readGhlWebhookPayload } from "@/lib/ghl-webhook-payload";
import { notifyPartnershipNotQualified } from "@/lib/notify";

export const dynamic = "force-dynamic";

/**
 * GHL workflow target for when a contact moves to the "Not Qualified" stage in the JDC
 * Partnership Program pipeline: add a Webhook action to that trigger pointing here, and the
 * applicant gets the "join JDC Elite Society first" SMS. The matching email is sent separately
 * from the same GHL workflow using email-templates/partnership-not-qualified.html.
 */

export async function GET() {
  return NextResponse.json({ ok: true, service: "partnership-ghl-webhook-not-qualified" });
}

export async function POST(request: Request) {
  if (!checkWebhookSecret(request, process.env.GHL_PARTNERSHIP_WEBHOOK_SECRET, process.env.GHL_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = await readGhlWebhookPayload(request);
  const { email, fullName, phone } = contactFromPayload(payload);
  if (!phone) {
    return NextResponse.json({ error: "Missing contact phone." }, { status: 400 });
  }

  notifyPartnershipNotQualified({ name: fullName, email, phone }).catch((error) => {
    console.error("Partnership not qualified webhook notice failed", error);
  });

  return NextResponse.json({ ok: true });
}
