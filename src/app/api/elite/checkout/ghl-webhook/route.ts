import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import {
  createUser,
  ensureSeedUsers,
  findUserByEmailOrPhone,
  grantMastermindMembership,
  requestPasswordReset,
} from "@/lib/auth-store";
import { createLead } from "@/lib/crm-store";
import { notifyMastermindPurchase } from "@/lib/notify";
import { COURSE_ACCESS_TAGS, JDC_MASTERMIND_PAYMENT_VERIFICATION_TAG, uniqueTags } from "@/lib/tags";

export const dynamic = "force-dynamic";

/**
 * GHL workflow target for the "S1 Building Checkout Form" (form id
 * 22fC57U5wPPBVd3tt22a): on Form Submitted, the JDC subaccount posts the
 * contact here so the buyer gets a JDC Mastermind account on coachjdc.org
 * without anyone in ops touching the dashboard.
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
  return NextResponse.json({ ok: true, service: "elite-checkout-ghl-webhook" });
}

export async function POST(request: Request) {
  const secret = (process.env.GHL_BUILDING_CHECKOUT_WEBHOOK_SECRET ?? process.env.GHL_WEBHOOK_SECRET)?.trim();
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

  await ensureSeedUsers();

  let user;
  try {
    const existing = await findUserByEmailOrPhone(email, phone);
    user = existing
      ? await grantMastermindMembership(existing.id)
      : await createUser({
          name: fullName,
          email,
          password: randomBytes(18).toString("hex"),
          role: "member",
          phone,
          phoneCountry: "PH",
          company: "JDC Mastermind",
          memberships: ["jes"],
          profileComplete: true,
          paymentVerified: true,
          passwordSet: false,
        });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "I couldn't set up this JDC account." },
      { status: 400 },
    );
  }

  const tags = uniqueTags([
    "JDC Mastermind",
    "jdc-mastermind",
    "jdc-mastermind-buyer",
    "S1 Building Checkout Form",
    JDC_MASTERMIND_PAYMENT_VERIFICATION_TAG,
    ...COURSE_ACCESS_TAGS,
  ]);

  try {
    await createLead({
      name: fullName,
      email,
      phone,
      dateOfBirth: "",
      address: "",
      city: "",
      tags,
      bestDescribesYou: "JDC Mastermind buyer",
      programInterest: "JDC Mastermind Season 1 - Building",
      source: "S1 Building Checkout Form (GHL)",
    });
  } catch (error) {
    console.error("S1 Building GHL webhook CRM lead sync failed", error);
  }

  // The buyer never lands on our site during a GHL-hosted checkout, so there's no browser
  // session to hand them access through — email them a set-password link instead.
  requestPasswordReset(email).catch((error) => {
    console.error("S1 Building GHL webhook access email failed", error);
  });

  notifyMastermindPurchase({
    name: fullName,
    email,
    phone,
    paymentMethod: "GHL checkout form",
    priceLabel: "S1 Building",
    couponCode: "",
    receiptUrl: "",
    tags,
  }).catch((error) => {
    console.error("S1 Building GHL webhook purchase notice failed", error);
  });

  return NextResponse.json({ ok: true, userId: user.id });
}
