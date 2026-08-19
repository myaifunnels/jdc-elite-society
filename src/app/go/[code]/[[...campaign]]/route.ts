import { NextRequest, NextResponse } from "next/server";

import { AFFILIATE_COOKIE, AFFILIATE_COOKIE_MAX_AGE, normalizeAffiliateCode } from "@/lib/affiliate";
import { recordClick, resolveGoDestination } from "@/lib/affiliate-store";

function safePath(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) {
    return "/register";
  }
  return path;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string; campaign?: string[] }> },
) {
  const { code: rawCode, campaign } = await context.params;
  const code = normalizeAffiliateCode(rawCode ?? "");
  const campaignSlug = normalizeAffiliateCode(campaign?.[0] ?? "");

  if (!code) {
    return NextResponse.redirect(new URL("/register", request.url));
  }

  const { profile, destination } = await resolveGoDestination(code, campaignSlug);
  const target = new URL(safePath(destination), request.url);
  const response = NextResponse.redirect(target);

  if (profile && profile.status !== "paused") {
    response.cookies.set(AFFILIATE_COOKIE, profile.code, {
      path: "/",
      maxAge: AFFILIATE_COOKIE_MAX_AGE,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    await recordClick({
      code: profile.code,
      campaignSlug,
      path: request.nextUrl.pathname,
      userAgent: request.headers.get("user-agent") ?? "",
    });
  }

  return response;
}
