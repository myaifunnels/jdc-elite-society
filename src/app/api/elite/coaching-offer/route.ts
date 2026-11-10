import { NextResponse } from "next/server";

import { mastermindOffer } from "@/data/mastermind-offer";
import { createEliteCheckoutOrder } from "@/lib/elite-checkout-store";
import { syncContactToGhl } from "@/lib/ghl";
import { notifyCoachingOfferPurchase } from "@/lib/notify";
import { storePaymentReceipt } from "@/lib/r2-upload";
import { getSessionUser } from "@/lib/session";
import { coachingOfferTags } from "@/lib/tags";
import { eliteCoachingOfferSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Your session expired. Please sign in again." }, { status: 401 });
  }

  const form = await request.formData();
  const parsed = eliteCoachingOfferSchema.safeParse({
    paymentMethod: String(form.get("paymentMethod") ?? "").trim(),
    coachingHours: Number(form.get("coachingHours") ?? 0),
    coachingMode: String(form.get("coachingMode") ?? ""),
  });

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return NextResponse.json({ error: firstError || "Check the coaching details." }, { status: 400 });
  }

  const receipt = form.get("receipt");
  if (!(receipt instanceof File) || !receipt.size) {
    return NextResponse.json({ error: "I-upload ang iyong resibo." }, { status: 400 });
  }

  const pricePerHour =
    parsed.data.coachingMode === "in-person"
      ? mastermindOffer.inPersonCoachingPricePerHour
      : mastermindOffer.coachingPricePerHour;
  const price = parsed.data.coachingHours * pricePerHour;
  const priceLabel = `PHP ${price.toLocaleString("en-PH")}`;

  let receiptUrl = "";
  try {
    receiptUrl = await storePaymentReceipt(receipt, user.email);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "I couldn't store the receipt." },
      { status: 400 },
    );
  }

  const tags = coachingOfferTags({
    coachingMode: parsed.data.coachingMode,
    coachingHours: parsed.data.coachingHours,
    priceLabel,
  });

  try {
    await createEliteCheckoutOrder({
      userId: user.id,
      fullName: user.name,
      email: user.email,
      mobile: user.phone,
      paymentMethod: parsed.data.paymentMethod,
      couponCode: "",
      basePrice: 0,
      coachingHours: parsed.data.coachingHours,
      coachingMode: parsed.data.coachingMode,
      price,
      receiptName: receipt.name,
      receiptUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "I couldn't save your payment submission." },
      { status: 400 },
    );
  }

  try {
    await syncContactToGhl({
      name: user.name,
      email: user.email,
      phone: user.phone,
      source: "1-on-1 Coaching offer",
      tags,
    });
  } catch (error) {
    console.error("Coaching offer GHL sync failed", error);
  }

  try {
    await notifyCoachingOfferPurchase({
      name: user.name,
      email: user.email,
      phone: user.phone,
      paymentMethod: parsed.data.paymentMethod,
      priceLabel,
      coachingHours: parsed.data.coachingHours,
      coachingMode: parsed.data.coachingMode,
      receiptUrl,
      tags,
    });
  } catch (error) {
    console.error("Coaching offer notifications failed", error);
  }

  return NextResponse.json({ ok: true, price: priceLabel, tags });
}
