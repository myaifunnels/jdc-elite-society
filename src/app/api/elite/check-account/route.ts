import { NextResponse } from "next/server";

import { ensureSeedUsers, findUserByEmailOrPhone } from "@/lib/auth-store";
import { formatInternationalPhone } from "@/lib/countries";

/** Lets the checkout form ask "does this email/phone already have an account?" right after step
 * 1 (details), before the visitor gets to payment/receipt upload — so if they need to sign in
 * instead, they haven't already picked a receipt file that a redirect or page reload would lose. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string; phoneCountry?: string; phoneNational?: string }
    | null;

  const email = body?.email?.trim().toLowerCase() ?? "";
  const phoneCountry = body?.phoneCountry?.trim().toUpperCase() || "PH";
  const phoneNational = body?.phoneNational?.trim() ?? "";

  if (!email && !phoneNational) {
    return NextResponse.json({ exists: false });
  }

  const mobile = phoneNational ? formatInternationalPhone(phoneCountry, phoneNational) : "";

  await ensureSeedUsers();
  const existing = await findUserByEmailOrPhone(email, mobile);
  return NextResponse.json({ exists: Boolean(existing) });
}
