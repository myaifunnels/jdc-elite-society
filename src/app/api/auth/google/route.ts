import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { getResolvedIntegrationSettings } from "@/lib/integrations-store";
import { signValue } from "@/lib/session";
import { siteUrl } from "@/lib/site";

// Short-lived cookie that carries the OAuth `state` + PKCE `code_verifier`
// across the redirect round-trip to Google and back. Signed with the same
// HMAC helper the session cookie machinery already uses (see src/lib/session.ts)
// so it can't be forged or tampered with while sitting in the browser.
export const GOOGLE_OAUTH_COOKIE = "coach-jdc-google-oauth";
const GOOGLE_OAUTH_COOKIE_MAX_AGE = 60 * 10; // 10 minutes

export async function GET(request: NextRequest) {
  const settings = await getResolvedIntegrationSettings();
  const clientId = settings.googleClientId;

  if (!clientId) {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", request.url));
  }

  const state = randomBytes(16).toString("hex");
  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");

  const redirectUri = new URL("/api/auth/google/callback", siteUrl).toString();

  const authorizeUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "openid email profile");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("access_type", "online");

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(GOOGLE_OAUTH_COOKIE, signValue(JSON.stringify({ state, codeVerifier })), {
    httpOnly: true,
    sameSite: "lax",
    path: "/api/auth/google",
    secure: process.env.NODE_ENV === "production",
    maxAge: GOOGLE_OAUTH_COOKIE_MAX_AGE,
  });

  return response;
}
