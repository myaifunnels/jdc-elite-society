import { NextResponse } from "next/server";
import { z } from "zod";

import { authenticateUser } from "@/lib/auth-store";
import { sessionCookieName } from "@/lib/session";
import { confirmWebinarRegistration } from "@/lib/webinar-notify";
import { getWebinar } from "@/lib/webinars-store";
import {
  createRegistrant,
  findRegistrantByUserAndWebinar,
  getFreeSeatsLeft,
} from "@/lib/webinar-registrants-store";

const schema = z.object({
  email: z.email("Enter a valid email address.").transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1, "Enter your password."),
});

/**
 * "Already have an account? Sign in" path from the webinar registration modal (task 2 of the
 * webinars hero rework). This intentionally does NOT call the `loginAccount` server action from
 * src/app/login/actions.ts directly: that action unconditionally redirect()s on success (to
 * /account/password or /dashboard?welcome=1), which would navigate the visitor away from this
 * modal before we get a chance to auto-register them for the webinar and show the thank-you
 * state. Instead this reuses the same underlying `authenticateUser` check loginAccount itself
 * calls — the actual password-verification logic isn't duplicated, only the redirect-driven
 * control flow is intentionally different.
 *
 * On success this also sets the session cookie unconditionally, same as loginAccount — that's
 * correct here (unlike the public /register route) because this endpoint only ever runs after
 * the visitor has proven their password, i.e. this *is* the login. It never fires for an
 * email/phone match alone.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const webinar = await getWebinar(id);
  if (!webinar) {
    return NextResponse.json({ ok: false, error: "This webinar could not be found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Check your email and password." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Check your email and password." },
      { status: 400 },
    );
  }

  const user = await authenticateUser(parsed.data.email, parsed.data.password);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "That email and password do not match. If you can't sign in, register first." },
      { status: 401 },
    );
  }
  if (!user.active) {
    return NextResponse.json(
      { ok: false, error: "This account has been deactivated. Contact support if you believe this is a mistake." },
      { status: 403 },
    );
  }

  function withSession(response: NextResponse) {
    response.cookies.set(sessionCookieName, user!.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  }

  // Don't double-register if this account already has a registration for this webinar — just
  // report it as already confirmed/pending so the client can go straight to the thank-you state.
  const existing = await findRegistrantByUserAndWebinar(webinar.id, user.id, user.email);
  if (existing) {
    return withSession(
      NextResponse.json({
        ok: true,
        status: "already_registered",
        tier: existing.tier,
        registrantStatus: existing.status,
        needsPasswordSetup: !user.passwordSet,
      }),
    );
  }

  // Never trust a stale client — recompute seats fresh, same as the public register route.
  const freeSeatsLeft = await getFreeSeatsLeft(webinar);
  if (freeSeatsLeft <= 0) {
    // Free seats are gone. An overflow seat requires a payment receipt this quick sign-in form
    // doesn't collect, so we sign them in and hand back their account details — the client drops
    // them into the existing overflow (receipt-upload) form instead, now as a logged-in user.
    return withSession(
      NextResponse.json({
        ok: true,
        status: "needs_overflow_payment",
        name: user.name,
        email: user.email,
        phone: user.phone,
      }),
    );
  }

  try {
    const registrant = await createRegistrant({
      webinarId: webinar.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      tier: "free",
    });
    if (registrant.status === "confirmed") {
      confirmWebinarRegistration(webinar, registrant).catch((error) =>
        console.error("Webinar registration confirmation failed", error),
      );
    }
    return withSession(
      NextResponse.json({
        ok: true,
        status: "registered",
        tier: registrant.tier,
        needsPasswordSetup: !user.passwordSet,
      }),
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "I couldn't save your registration." },
      { status: 400 },
    );
  }
}
