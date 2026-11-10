import { NextResponse } from "next/server";

import { setDuplicationEnrollmentStatus } from "@/lib/duplication-enrollments-store";
import { checkWebhookSecret, contactFromPayload, readGhlWebhookPayload } from "@/lib/ghl-webhook-payload";
import { notifyDuplicationPaymentRejected } from "@/lib/notify";

export const dynamic = "force-dynamic";

/**
 * GHL workflow target for when a JDC Mastermind: Duplication Season opportunity moves to the
 * rejected stage (or gets a "Payment Rejected" tag): add a Webhook action to that trigger
 * pointing here, and the buyer gets the "payment rejected" SMS.
 */

export async function GET() {
  return NextResponse.json({ ok: true, service: "elite-checkout-ghl-webhook-duplication-rejected" });
}

export async function POST(request: Request) {
  if (!checkWebhookSecret(request, process.env.GHL_DUPLICATION_CHECKOUT_WEBHOOK_SECRET, process.env.GHL_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = await readGhlWebhookPayload(request);
  const { email, fullName, phone } = contactFromPayload(payload);
  if (!email) {
    return NextResponse.json({ error: "Missing contact email." }, { status: 400 });
  }

  await setDuplicationEnrollmentStatus({ name: fullName, email, phone, status: "rejected" }).catch((error) => {
    console.error("S2 Duplication rejected webhook enrollment update failed", error);
  });

  notifyDuplicationPaymentRejected({ name: fullName, email, phone }).catch((error) => {
    console.error("S2 Duplication rejected webhook notice failed", error);
  });

  return NextResponse.json({ ok: true });
}
