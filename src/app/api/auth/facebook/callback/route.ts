import { NextRequest, NextResponse } from "next/server";

import { setSessionCookie } from "@/app/login/actions";
import { FACEBOOK_OAUTH_COOKIE } from "@/app/api/auth/facebook/route";
import { findOrCreateFacebookUser } from "@/lib/auth-store";
import { getResolvedIntegrationSettings } from "@/lib/integrations-store";
import { readSignedValue } from "@/lib/session";
import { siteUrl } from "@/lib/site";

const FACEBOOK_GRAPH_VERSION = "v21.0";

type FacebookTokenResponse = {
  access_token?: string;
  error?: { message?: string };
};

type FacebookUserInfo = {
  id?: string;
  name?: string;
  email?: string;
  picture?: { data?: { url?: string } };
  error?: { message?: string };
};

function failure(request: NextRequest, code: string) {
  const response = NextResponse.redirect(new URL(`/login?error=${code}`, request.url));
  // Always clear the temporary cookie so it can never be replayed, whether
  // this callback succeeds or fails.
  response.cookies.set(FACEBOOK_OAUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/api/auth/facebook",
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
    return failure(request, "facebook_failed");
  }

  const rawCookie = request.cookies.get(FACEBOOK_OAUTH_COOKIE)?.value;
  const signedValue = readSignedValue(rawCookie);
  if (!signedValue) {
    return failure(request, "facebook_failed");
  }

  let stored: { state?: string };
  try {
    stored = JSON.parse(signedValue);
  } catch {
    return failure(request, "facebook_failed");
  }

  if (!stored.state || stored.state !== state) {
    return failure(request, "facebook_failed");
  }

  const settings = await getResolvedIntegrationSettings();
  const appId = settings.facebookAppId;
  const appSecret = settings.facebookAppSecret;
  if (!appId || !appSecret) {
    return failure(request, "facebook_not_configured");
  }

  const redirectUri = new URL("/api/auth/facebook/callback", siteUrl).toString();

  try {
    const tokenUrl = new URL(`https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/oauth/access_token`);
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenResponse = await fetch(tokenUrl);
    const tokenData = (await tokenResponse.json()) as FacebookTokenResponse;
    if (!tokenResponse.ok || !tokenData.access_token) {
      return failure(request, "facebook_failed");
    }

    const profileUrl = new URL(`https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/me`);
    profileUrl.searchParams.set("fields", "id,name,email,picture.type(large)");
    profileUrl.searchParams.set("access_token", tokenData.access_token);

    const profileResponse = await fetch(profileUrl);
    const profile = (await profileResponse.json()) as FacebookUserInfo;

    if (!profileResponse.ok || !profile.id) {
      return failure(request, "facebook_failed");
    }

    const user = await findOrCreateFacebookUser({
      facebookId: profile.id,
      email: profile.email ?? "",
      name: profile.name ?? "",
      avatarUrl: profile.picture?.data?.url,
    });

    if (!user || !user.active) {
      return failure(request, "facebook_failed");
    }

    await setSessionCookie(user.id, true);

    const response = NextResponse.redirect(new URL("/dashboard?welcome=1", request.url));
    response.cookies.set(FACEBOOK_OAUTH_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/api/auth/facebook",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
      expires: new Date(0),
    });
    return response;
  } catch (error) {
    console.error("Facebook OAuth callback failed", error);
    return failure(request, "facebook_failed");
  }
}
