import { NextRequest, NextResponse } from "next/server";

import { AFFILIATE_CAMPAIGN_COOKIE, AFFILIATE_COOKIE, AFFILIATE_COOKIE_MAX_AGE, normalizeAffiliateCode } from "@/lib/affiliate";
import { recordClick, resolveGoDestination } from "@/lib/affiliate-store";
import { siteUrl } from "@/lib/site";

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
  const { code: rawCode, campaign: campaignParts } = await context.params;
  const code = normalizeAffiliateCode(rawCode ?? "");
  const campaignSlug = normalizeAffiliateCode(campaignParts?.[0] ?? "");
  const origin = siteUrl;

  if (!code) {
    return NextResponse.redirect(new URL("/register", origin));
  }

  const { profile, destination, campaign: product } = await resolveGoDestination(code, campaignSlug);
  const target = new URL(safePath(destination), origin);
  const response = NextResponse.redirect(target);

  if (profile && profile.status !== "paused" && product) {
    response.cookies.set(AFFILIATE_COOKIE, profile.code, {
      path: "/",
      maxAge: AFFILIATE_COOKIE_MAX_AGE,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    response.cookies.set(AFFILIATE_CAMPAIGN_COOKIE, product.slug, {
      path: "/",
      maxAge: AFFILIATE_COOKIE_MAX_AGE,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    await recordClick({
      code: profile.code,
      campaignSlug: product.slug,
      path: request.nextUrl.pathname,
      userAgent: request.headers.get("user-agent") ?? "",
    });
  }

  return response;
}
