import { NextRequest, NextResponse } from "next/server";

import { setSessionCookie } from "@/app/login/actions";
import { GOOGLE_OAUTH_COOKIE } from "@/app/api/auth/google/route";
import { findOrCreateGoogleUser } from "@/lib/auth-store";
import { getResolvedIntegrationSettings } from "@/lib/integrations-store";
import { readSignedValue } from "@/lib/session";

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
};

type GoogleUserInfo = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

function failure(request: NextRequest, code: string) {
  const response = NextResponse.redirect(new URL(`/login?error=${code}`, request.url));
  // Always clear the temporary cookie so it can never be replayed, whether
  // this callback succeeds or fails.
  response.cookies.set(GOOGLE_OAUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/api/auth/google",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return failure(request, "google_failed");
  }

  const rawCookie = request.cookies.get(GOOGLE_OAUTH_COOKIE)?.value;
  const signedValue = readSignedValue(rawCookie);
  if (!signedValue) {
    return failure(request, "google_failed");
  }

  let stored: { state?: string; codeVerifier?: string };
  try {
    stored = JSON.parse(signedValue);
  } catch {
    return failure(request, "google_failed");
  }

  if (!stored.state || !stored.codeVerifier || stored.state !== state) {
    return failure(request, "google_failed");
  }

  const settings = await getResolvedIntegrationSettings();
  const clientId = settings.googleClientId;
  const clientSecret = settings.googleClientSecret;
  if (!clientId || !clientSecret) {
    return failure(request, "google_not_configured");
  }

  const redirectUri = new URL("/api/auth/google/callback", request.nextUrl.origin).toString();

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code_verifier: stored.codeVerifier,
      }),
    });

    const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;
    if (!tokenResponse.ok || !tokenData.access_token) {
      return failure(request, "google_failed");
    }

    const userInfoResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoResponse.ok) {
      return failure(request, "google_failed");
    }

    const profile = (await userInfoResponse.json()) as GoogleUserInfo;

    if (!profile.sub || !profile.email) {
      return failure(request, "google_failed");
    }

    // Only explicit `false` is a rejection - Google omits this field for some
    // legacy scopes/tokens, and an absent value should not be treated as unverified.
    if (profile.email_verified === false) {
      return failure(request, "google_email_unverified");
    }

    const user = await findOrCreateGoogleUser({
      googleId: profile.sub,
      email: profile.email,
      name: profile.name ?? "",
      avatarUrl: profile.picture,
    });

    if (!user || !user.active) {
      return failure(request, "google_failed");
    }

    await setSessionCookie(user.id, true);

    const response = NextResponse.redirect(new URL("/dashboard?welcome=1", request.url));
    response.cookies.set(GOOGLE_OAUTH_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/api/auth/google",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
      expires: new Date(0),
    });
    return response;
  } catch (error) {
    console.error("Google OAuth callback failed", error);
    return failure(request, "google_failed");
  }
}
