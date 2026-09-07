import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { createUser, findUserByEmailOrPhone } from "@/lib/auth-store";
import { storeRegistrantPhoto, storeWebinarReceipt } from "@/lib/r2-upload";
import { getSessionUser, sessionCookieName } from "@/lib/session";
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

  // Resolve which account this registration belongs to, in priority order:
  // 1. An already-logged-in visitor — use their session, no lookup needed.
  // 2. An existing account matched by email or phone — link silently, no login required.
  // 3. A brand-new person — auto-create a throwaway-password account and sign them in.
  // This never influences seat tier and is purely additive to the existing seat logic below.
  let userId = "";
  let newAccountId = "";

  const sessionUser = await getSessionUser();
  if (sessionUser) {
    userId = sessionUser.id;
  } else {
    const existingUser = await findUserByEmailOrPhone(parsed.data.email, parsed.data.phone);
    if (existingUser) {
      userId = existingUser.id;
    } else {
      try {
        const created = await createUser({
          name: parsed.data.name,
          email: parsed.data.email,
          password: randomBytes(18).toString("hex"),
          role: "member",
          phone: parsed.data.phone,
          memberships: ["jes"],
          // A free webinar registration is not a paid membership — do not grant paid-content
          // access (paymentVerified) or mark the profile complete just from registering.
          profileComplete: false,
          paymentVerified: false,
          passwordSet: false,
        });
        userId = created.id;
        newAccountId = created.id;
      } catch (error) {
        // If account creation races with another request for the same email/phone, just
        // proceed without a linked account rather than failing the registration.
        console.error("Failed to auto-create webinar registrant account", error);
      }
    }
  }

  // Never trust the client's idea of which tier applies — always recompute from the current
  // confirmed-registrant count so a stale page can't slip a free seat past a sold-out webinar,
  // and so a client that thinks seats are open can't skip the required receipt.
  const freeSeatsLeft = await getFreeSeatsLeft(webinar);
  const isOverflow = freeSeatsLeft <= 0;

  function withSession(response: NextResponse) {
    if (newAccountId) {
      response.cookies.set(sessionCookieName, newAccountId, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return response;
  }

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
        userId,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        photoUrl,
        tier: "free",
      });
      return withSession(NextResponse.json({ ok: true, tier: registrant.tier, status: registrant.status }));
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
      userId,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      photoUrl,
      tier: "paid_overflow",
      paymentReceiptUrl: receiptUrl,
      amountPaid: WEBINAR_OVERFLOW_PRICE,
    });
    return withSession(NextResponse.json({ ok: true, tier: registrant.tier, status: registrant.status }));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "I couldn't save your registration." },
      { status: 400 },
    );
  }
}
