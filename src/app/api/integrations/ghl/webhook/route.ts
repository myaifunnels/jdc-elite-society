import { NextResponse } from "next/server";

import { getGhlSyncState } from "@/lib/crm-store";
import { handleGhlWebhook } from "@/lib/ghl";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const provided =
    url.searchParams.get("secret") ||
    request.headers.get("x-ghl-webhook-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";
  const state = await getGhlSyncState();

  if (!state.webhookSecret || provided !== state.webhookSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const result = await handleGhlWebhook(body);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
