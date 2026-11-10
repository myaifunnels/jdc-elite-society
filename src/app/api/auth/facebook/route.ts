import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import { getResolvedIntegrationSettings } from "@/lib/integrations-store";
import { signValue } from "@/lib/session";
import { siteUrl } from "@/lib/site";

// Short-lived cookie that carries the OAuth `state` across the redirect
// round-trip to Facebook and back. Signed with the same HMAC helper the
// session cookie machinery already uses (see src/lib/session.ts) so it can't
// be forged or tampered with while sitting in the browser. Facebook's OAuth
// dialog doesn't support PKCE, so this mirrors the Google flow minus the
// code_verifier/code_challenge pair.
export const FACEBOOK_OAUTH_COOKIE = "coach-jdc-facebook-oauth";
const FACEBOOK_OAUTH_COOKIE_MAX_AGE = 60 * 10; // 10 minutes
const FACEBOOK_GRAPH_VERSION = "v21.0";

export async function GET() {
  const settings = await getResolvedIntegrationSettings();
  const appId = settings.facebookAppId;

  if (!appId) {
    return NextResponse.redirect(new URL("/login?error=facebook_not_configured", siteUrl));
  }

  const state = randomBytes(16).toString("hex");
  const redirectUri = new URL("/api/auth/facebook/callback", siteUrl).toString();

  const authorizeUrl = new URL(`https://www.facebook.com/${FACEBOOK_GRAPH_VERSION}/dialog/oauth`);
  authorizeUrl.searchParams.set("client_id", appId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "email,public_profile");
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(FACEBOOK_OAUTH_COOKIE, signValue(JSON.stringify({ state })), {
    httpOnly: true,
    sameSite: "lax",
    path: "/api/auth/facebook",
    secure: process.env.NODE_ENV === "production",
    maxAge: FACEBOOK_OAUTH_COOKIE_MAX_AGE,
  });

  return response;
}
