import { NextResponse } from "next/server";

import { createLead } from "@/lib/crm-store";
import { upsertPendingDuplicationEnrollment } from "@/lib/duplication-enrollments-store";
import { checkWebhookSecret, contactFromPayload, readGhlWebhookPayload } from "@/lib/ghl-webhook-payload";
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

export async function GET() {
  return NextResponse.json({ ok: true, service: "elite-checkout-ghl-webhook-duplication" });
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
      bestDescribesYou: "JDC Mastermind: Duplication Season buyer",
      programInterest: "JDC Mastermind: Duplication Season",
      source: "S2 Duplication Checkout Form (GHL)",
    });
  } catch (error) {
    console.error("S2 Duplication GHL webhook CRM lead sync failed", error);
  }

  notifyDuplicationPaymentReceived({ name: fullName, email, phone }).catch((error) => {
    console.error("S2 Duplication GHL webhook purchase notice failed", error);
  });

  await upsertPendingDuplicationEnrollment({ name: fullName, email, phone }).catch((error) => {
    console.error("S2 Duplication GHL webhook enrollment tracking failed", error);
  });

  return NextResponse.json({ ok: true });
}
