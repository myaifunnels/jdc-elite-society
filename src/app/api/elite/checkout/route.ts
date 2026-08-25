import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { mastermindOffer } from "@/data/mastermind-offer";
import { AFFILIATE_CAMPAIGN_COOKIE, AFFILIATE_COOKIE, normalizeAffiliateCode } from "@/lib/affiliate";
import { getProfileByCode, recordAttribution } from "@/lib/affiliate-store";
import { createUser, deleteUser, ensureSeedUsers, findUserByEmailOrPhone } from "@/lib/auth-store";
import { formatInternationalPhone } from "@/lib/countries";
import { createLead } from "@/lib/crm-store";
import { createEliteCheckoutOrder } from "@/lib/elite-checkout-store";
import { syncContactToGhl } from "@/lib/ghl";
import { notifyMastermindPurchase } from "@/lib/notify";
import { storePaymentReceipt } from "@/lib/r2-upload";
import { sessionCookieName } from "@/lib/session";
import { mastermindCheckoutTags } from "@/lib/tags";
import { eliteCheckoutSchema } from "@/lib/validations";

const couponCode = mastermindOffer.couponCode;

function appliedCoupon(raw: string) {
  return raw.trim().toUpperCase() === couponCode;
}

async function upsertFunnelContact(input: {
  fullName: string;
  email: string;
  mobile: string;
  paymentMethod: string;
  couponCode: string;
  receiptName: string;
  receiptUrl: string;
  priceLabel: string;
  spartans: boolean;
  tags: string[];
}) {
  await fetch("https://api.myaifunnels.com/contacts/upsert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      trackingId: mastermindOffer.funnelTrackingId,
      locationId: mastermindOffer.funnelLocationId,
      contact: {
        firstName: input.fullName,
        email: input.email,
        phone: input.mobile,
        tags: input.tags,
        customField: {
          "Payment Method": input.paymentMethod,
          "Receipt File": input.receiptName,
          "Receipt URL": input.receiptUrl,
          "Coupon Code": input.couponCode || "None",
          "Final Price": input.priceLabel,
        },
      },
    }),
  }).catch(() => null);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const parsed = eliteCheckoutSchema.safeParse({
    fullName: String(form.get("fullName") ?? "").trim(),
    email: String(form.get("email") ?? "").trim(),
    phoneCountry: String(form.get("phoneCountry") ?? "PH").trim().toUpperCase() || "PH",
    phoneNational: String(form.get("phoneNational") ?? "").trim(),
    paymentMethod: String(form.get("paymentMethod") ?? "").trim(),
    couponCode: String(form.get("couponCode") ?? "").trim(),
  });

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return NextResponse.json({ error: firstError || "Check the payment details." }, { status: 400 });
  }

  const receipt = form.get("receipt");
  if (!(receipt instanceof File) || !receipt.size) {
    return NextResponse.json({ error: "I-upload ang iyong resibo." }, { status: 400 });
  }

  const spartans = appliedCoupon(parsed.data.couponCode);
  const price = spartans ? mastermindOffer.couponPrice : mastermindOffer.offerPrice;
  const priceLabel = `PHP ${price.toLocaleString("en-PH")}`;
  const mobile = formatInternationalPhone(parsed.data.phoneCountry, parsed.data.phoneNational);

  await ensureSeedUsers();
  const existing = await findUserByEmailOrPhone(parsed.data.email, mobile);
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email or mobile number already exists. Sign in or use another account." },
      { status: 409 },
    );
  }

  let receiptUrl = "";
  try {
    receiptUrl = await storePaymentReceipt(receipt, parsed.data.email);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "I couldn't store the receipt." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const referralCode = normalizeAffiliateCode(cookieStore.get(AFFILIATE_COOKIE)?.value ?? "");
  const campaignSlug = normalizeAffiliateCode(cookieStore.get(AFFILIATE_CAMPAIGN_COOKIE)?.value ?? "");
  const affiliate = referralCode ? await getProfileByCode(referralCode) : null;
  const extraTags = affiliate
    ? [`affiliate:${affiliate.code}`, campaignSlug ? `campaign:${campaignSlug}` : ""].filter(Boolean)
    : [];

  const tags = mastermindCheckoutTags({
    paymentMethod: parsed.data.paymentMethod,
    priceLabel,
    couponApplied: spartans,
    extra: extraTags,
  });

  let user;
  try {
    user = await createUser({
      name: parsed.data.fullName,
      email: parsed.data.email,
      password: randomBytes(18).toString("hex"),
      role: "member",
      phone: mobile || parsed.data.phoneNational,
      phoneCountry: parsed.data.phoneCountry,
      company: "JDC Mastermind",
      profileComplete: true,
      paymentVerified: true,
      passwordSet: false,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "I couldn't create your JDC account." },
      { status: 400 },
    );
  }

  try {
    await createEliteCheckoutOrder({
      userId: user.id,
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      mobile: mobile || parsed.data.phoneNational,
      paymentMethod: parsed.data.paymentMethod,
      couponCode: parsed.data.couponCode,
      basePrice: price,
      coachingHours: 0,
      coachingMode: "",
      price,
      receiptName: receipt.name,
      receiptUrl,
    });
  } catch (error) {
    try {
      await deleteUser(user.id);
    } catch (rollbackError) {
      console.error("Failed to roll back Mastermind account", rollbackError);
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "I couldn't save your payment submission." },
      { status: 400 },
    );
  }

  let leadId: string | null = null;
  try {
    const lead = await createLead({
      name: parsed.data.fullName,
      email: parsed.data.email,
      phone: mobile || parsed.data.phoneNational,
      dateOfBirth: "",
      address: "",
      city: "",
      tags,
      bestDescribesYou: "JDC Mastermind buyer",
      programInterest: "JDC Mastermind",
      photoUrl: receiptUrl,
      source: affiliate ? `Mastermind offer · ${affiliate.code}` : "Mastermind offer",
    });
    leadId = lead.id;
  } catch (error) {
    console.error("Mastermind CRM lead sync failed", error);
  }

  if (affiliate) {
    try {
      await recordAttribution({
        kind: "inquiry",
        code: affiliate.code,
        campaignSlug,
        email: parsed.data.email,
        name: parsed.data.fullName,
      });
    } catch (error) {
      console.error("Mastermind affiliate attribution failed", error);
    }
  }

  let ghlContactId: string | null = null;
  try {
    const ghl = await syncContactToGhl({
      name: parsed.data.fullName,
      email: parsed.data.email,
      phone: mobile || parsed.data.phoneNational,
      source: affiliate ? `Mastermind offer · ${affiliate.code}` : "Mastermind offer",
      tags,
    });
    ghlContactId = ghl.contactId ?? null;
  } catch (error) {
    console.error("Mastermind GHL sync failed", error);
  }

  await upsertFunnelContact({
    fullName: parsed.data.fullName,
    email: parsed.data.email,
    mobile: mobile || parsed.data.phoneNational,
    paymentMethod: parsed.data.paymentMethod,
    couponCode: parsed.data.couponCode || "None",
    receiptName: receipt.name,
    receiptUrl,
    priceLabel,
    spartans,
    tags,
  });

  try {
    await notifyMastermindPurchase({
      name: parsed.data.fullName,
      email: parsed.data.email,
      phone: mobile || parsed.data.phoneNational,
      paymentMethod: parsed.data.paymentMethod,
      priceLabel,
      couponCode: parsed.data.couponCode || "None",
      receiptUrl,
      tags,
    });
  } catch (error) {
    console.error("Mastermind notifications failed", error);
  }

  const response = NextResponse.json({
    ok: true,
    userId: user.id,
    leadId,
    price: priceLabel,
    tags,
    ghlContactId,
  });
  response.cookies.set(sessionCookieName, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
