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
      user.role !== "admin"
    ) {
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }
  }

  const settings = await getResolvedIntegrationSettings();
  if (!isR2Ready(settings)) {
    return NextResponse.json({ error: "Cloudflare R2 is not connected." }, { status: 503 });
  }

  const file = await getR2Object(settings, key);
  if (!file.ok) {
    return NextResponse.json({ error: "File not found." }, { status: file.status === 403 ? 403 : 404 });
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
