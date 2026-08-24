import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { mastermindOffer } from "@/data/mastermind-offer";
import { AFFILIATE_CAMPAIGN_COOKIE, AFFILIATE_COOKIE, normalizeAffiliateCode } from "@/lib/affiliate";
import { getProfileByCode, recordAttribution } from "@/lib/affiliate-store";
import { createLead } from "@/lib/crm-store";
import { syncContactToGhl } from "@/lib/ghl";
import { toE164Phone } from "@/lib/identity";
import { notifyMastermindPurchase } from "@/lib/notify";
import { storePaymentReceipt } from "@/lib/r2-upload";
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
    mobile: String(form.get("mobile") ?? "").trim(),
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
  const mobile = toE164Phone(parsed.data.mobile);

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

  const lead = await createLead({
    name: parsed.data.fullName,
    email: parsed.data.email,
    phone: mobile || parsed.data.mobile,
    dateOfBirth: "",
    address: "",
    city: "",
    tags,
    bestDescribesYou: "JDC Mastermind buyer",
    programInterest: "JDC Mastermind",
    photoUrl: receiptUrl,
    source: affiliate ? `Mastermind offer · ${affiliate.code}` : "Mastermind offer",
  });

  if (affiliate) {
    await recordAttribution({
      kind: "inquiry",
      code: affiliate.code,
      campaignSlug,
      email: parsed.data.email,
      name: parsed.data.fullName,
    });
  }

  const ghl = await syncContactToGhl({
    name: parsed.data.fullName,
    email: parsed.data.email,
    phone: mobile || parsed.data.mobile,
    source: affiliate ? `Mastermind offer · ${affiliate.code}` : "Mastermind offer",
    tags,
  });

  await upsertFunnelContact({
    fullName: parsed.data.fullName,
    email: parsed.data.email,
    mobile: mobile || parsed.data.mobile,
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
      phone: mobile || parsed.data.mobile,
      paymentMethod: parsed.data.paymentMethod,
      priceLabel,
      couponCode: parsed.data.couponCode || "None",
      receiptUrl,
      tags,
    });
  } catch (error) {
    console.error("Mastermind notifications failed", error);
  }

  return NextResponse.json({
    ok: true,
    leadId: lead.id,
    price: priceLabel,
    tags,
    ghlContactId: ghl.contactId ?? null,
  });
}
