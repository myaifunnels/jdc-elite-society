import { NextResponse } from "next/server";
import { z } from "zod";

import { storeRegistrantPhoto, storeWebinarReceipt } from "@/lib/r2-upload";
import { WEBINAR_OVERFLOW_PRICE } from "@/lib/webinars";
import { getWebinar } from "@/lib/webinars-store";
import { createRegistrant, getFreeSeatsLeft } from "@/lib/webinar-registrants-store";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(100),
  email: z.email("Enter a valid email address.").transform((value) => value.trim().toLowerCase()),
  phone: z.string().trim().min(7, "Enter a valid phone number.").max(24),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const webinar = await getWebinar(id);
  if (!webinar) {
    return NextResponse.json({ error: "This webinar could not be found." }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "We could not read your registration." }, { status: 400 });
  }

  const parsed = schema.safeParse({
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? ""),
    phone: String(form.get("phone") ?? ""),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check your details and try again." },
      { status: 400 },
    );
  }

  // Never trust the client's idea of which tier applies — always recompute from the current
  // confirmed-registrant count so a stale page can't slip a free seat past a sold-out webinar,
  // and so a client that thinks seats are open can't skip the required receipt.
  const freeSeatsLeft = await getFreeSeatsLeft(webinar);
  const isOverflow = freeSeatsLeft <= 0;

  const photoFile = form.get("photo");
  let photoUrl = "";
  if (photoFile instanceof File && photoFile.size > 0) {
    try {
      photoUrl = await storeRegistrantPhoto(photoFile, webinar.id);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "I couldn't store that photo." },
        { status: 400 },
      );
    }
  }

  if (!isOverflow) {
    try {
      const registrant = await createRegistrant({
        webinarId: webinar.id,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        photoUrl,
        tier: "free",
      });
      return NextResponse.json({ ok: true, tier: registrant.tier, status: registrant.status });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "I couldn't save your registration." },
        { status: 400 },
      );
    }
  }

  const receiptFile = form.get("receipt");
  if (!(receiptFile instanceof File) || !receiptFile.size) {
    return NextResponse.json(
      { error: "Free seats are full — upload your payment receipt to reserve an overflow seat." },
      { status: 400 },
    );
  }

  let receiptUrl = "";
  try {
    receiptUrl = await storeWebinarReceipt(receiptFile, parsed.data.email);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "I couldn't store that receipt." },
      { status: 400 },
    );
  }

  try {
    const registrant = await createRegistrant({
      webinarId: webinar.id,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      photoUrl,
      tier: "paid_overflow",
      paymentReceiptUrl: receiptUrl,
      amountPaid: WEBINAR_OVERFLOW_PRICE,
    });
    return NextResponse.json({ ok: true, tier: registrant.tier, status: registrant.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "I couldn't save your registration." },
      { status: 400 },
    );
  }
}
