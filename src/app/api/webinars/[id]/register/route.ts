import { NextResponse } from "next/server";
import { z } from "zod";

import { TEMPORARY_MEMBER_PASSWORD } from "@/lib/auth-constants";
import { createUser, findUserByEmailOrPhone, issueTemporaryPassword } from "@/lib/auth-store";
import { storeRegistrantPhoto, storeWebinarReceipt } from "@/lib/r2-upload";
import { getSessionUser, sessionCookieName } from "@/lib/session";
import { confirmWebinarRegistration } from "@/lib/webinar-notify";
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
  // 2. An existing account matched by email or phone — this is *their* account, so we never
  //    silently attach a registration to it without proof of ownership. Instead, issue the
  //    well-known temporary password (same one used everywhere else in this codebase — see
  //    src/lib/auth-constants.ts) and tell the client to switch to the sign-in tab, which
  //    completes the registration only after a successful login (see signin-register/route.ts).
  // 3. A brand-new person — create their account with that same temporary password and sign
  //    them in immediately (no identity to verify — the account didn't exist a moment ago), then
  //    have the client route them through /account/password to upload a photo and set a real
  //    password, exactly like every other auto-created account in this codebase.
  let userId = "";
  let newAccountId = "";
  let needsPasswordSetup = false;

  const sessionUser = await getSessionUser();
  if (sessionUser) {
    userId = sessionUser.id;
    needsPasswordSetup = !sessionUser.passwordSet;
  } else {
    const existingUser = await findUserByEmailOrPhone(parsed.data.email, parsed.data.phone);
    if (existingUser) {
      if (existingUser.role !== "admin" && existingUser.role !== "partner") {
        await issueTemporaryPassword(existingUser.id);
      }
      return NextResponse.json({
        ok: false,
        accountExists: true,
        email: existingUser.email,
        error: "This email already has an account. Sign in to finish registering.",
      });
    }

    try {
      const created = await createUser({
        name: parsed.data.name,
        email: parsed.data.email,
        password: TEMPORARY_MEMBER_PASSWORD,
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
      needsPasswordSetup = true;
    } catch (error) {
      // If account creation races with another request for the same email/phone, just
      // proceed without a linked account rather than failing the registration.
      console.error("Failed to auto-create webinar registrant account", error);
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
      if (registrant.status === "confirmed") {
        confirmWebinarRegistration(webinar, registrant).catch((error) =>
          console.error("Webinar registration confirmation failed", error),
        );
      }
      return withSession(
        NextResponse.json({ ok: true, tier: registrant.tier, status: registrant.status, needsPasswordSetup }),
      );
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
    return withSession(
      NextResponse.json({ ok: true, tier: registrant.tier, status: registrant.status, needsPasswordSetup }),
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "I couldn't save your registration." },
      { status: 400 },
    );
  }
}
