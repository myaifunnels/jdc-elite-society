import { NextResponse } from "next/server";

import { hasAccess } from "@/lib/access";
import { resolveAccess } from "@/lib/access-store";
import { isR2Ready } from "@/lib/integrations";
import { getResolvedIntegrationSettings } from "@/lib/integrations-store";
import { extractR2ObjectKey } from "@/lib/media";
import { getR2Object } from "@/lib/r2-upload";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const raw = new URL(request.url).searchParams.get("key") ?? "";
  const key = extractR2ObjectKey(raw);
  if (!key) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }

  if (key.startsWith("receipts/")) {
    const access = await resolveAccess(user);
    if (
      !hasAccess(access, "registrations") &&
      !hasAccess(access, "contacts.view") &&
      !hasAccess(access, "contacts.all") &&
      !hasAccess(access, "webinars") &&
      user.role !== "admin"
    ) {
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }
  }

  const fallbackParam = new URL(request.url).searchParams.get("fallback");
  const fallback = fallbackParam && /^https?:\/\//i.test(fallbackParam) ? fallbackParam : null;

  // Fetch the fallback URL ourselves and stream it back, rather than redirecting the
  // browser there. Some admins are on networks (corporate firewalls, certain ISPs) that
  // can't resolve r2.dev at all, so sending their browser there directly just trades one
  // dead link for another. Our server can reach it even when their browser can't.
  async function proxyFallback() {
    if (!fallback) return null;
    try {
      const response = await fetch(fallback, { cache: "no-store" });
      if (!response.ok) return null;
      const bytes = Buffer.from(await response.arrayBuffer());
      return new NextResponse(new Uint8Array(bytes), {
        headers: {
          "Content-Type": response.headers.get("content-type") ?? "application/octet-stream",
          "Content-Length": String(bytes.length),
          "Cache-Control": "private, max-age=300",
          "Content-Disposition": "inline",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch {
      return null;
    }
  }

  const settings = await getResolvedIntegrationSettings();
  if (!isR2Ready(settings)) {
    return (await proxyFallback()) ?? NextResponse.json({ error: "Cloudflare R2 is not connected." }, { status: 503 });
  }

  const file = await getR2Object(settings, key);
  if (!file.ok) {
    // The object isn't in our configured R2 bucket (e.g. it was uploaded to a different
    // R2 account, like a direct GHL upload). Fall back to fetching the original URL
    // ourselves rather than leaving the admin with a dead link.
    return (
      (await proxyFallback()) ??
      NextResponse.json({ error: "File not found." }, { status: file.status === 403 ? 403 : 404 })
    );
  }

  return new NextResponse(new Uint8Array(file.body), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Length": String(file.body.length),
      "Cache-Control": "private, max-age=300",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
