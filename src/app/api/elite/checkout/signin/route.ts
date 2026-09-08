import { NextResponse } from "next/server";
import { z } from "zod";

import { authenticateUser } from "@/lib/auth-store";
import { sessionCookieName } from "@/lib/session";

const schema = z.object({
  email: z.email("Enter a valid email address.").transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1, "Enter your password."),
});

/**
 * "You already have an account — sign in to continue" step inside the Mastermind checkout form.
 * Mirrors src/app/api/webinars/[id]/signin-register/route.ts: reuses authenticateUser directly
 * instead of the loginAccount server action, since that action unconditionally redirect()s on
 * success and would navigate the visitor out of the in-page checkout flow. Only sets the session
 * cookie — the actual checkout order is created by a follow-up POST to /api/elite/checkout,
 * which picks up this session and attaches the order to the now-authenticated account instead of
 * creating a duplicate one.
 */
export async function POST(request: Request) {
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
      { ok: false, error: "That email and password don't match. Try again or use Google instead." },
      { status: 401 },
    );
  }
  if (!user.active) {
    return NextResponse.json(
      { ok: false, error: "This account has been deactivated. Contact support if you believe this is a mistake." },
      { status: 403 },
    );
  }

  const response = NextResponse.json({
    ok: true,
    name: user.name,
    email: user.email,
    phone: user.phone,
    phoneCountry: user.phoneCountry,
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
