import { NextRequest, NextResponse } from "next/server";

import { AFFILIATE_COOKIE, AFFILIATE_COOKIE_MAX_AGE, normalizeAffiliateCode } from "@/lib/affiliate";
import { recordClick, resolveGoDestination } from "@/lib/affiliate-store";
import { siteUrl } from "@/lib/site";

function safePath(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) {
    return "/register";
  }
  return path;
}

function publicOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost && !forwardedHost.includes("0.0.0.0")) {
    return `${forwardedProto}://${forwardedHost.split(",")[0].trim()}`;
  }

  const host = request.headers.get("host") ?? "";
  if (host && !host.startsWith("0.0.0.0") && !host.startsWith("127.0.0.1") && !host.startsWith("localhost")) {
    return `${forwardedProto}://${host}`;
  }

  return siteUrl;
}

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
    return NextResponse.redirect(new URL("/register", publicOrigin(request)));
  }

  const { profile, destination } = await resolveGoDestination(code, campaignSlug);
  const target = new URL(safePath(destination), publicOrigin(request));
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
