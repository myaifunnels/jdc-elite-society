import { NextResponse } from "next/server";

import { suggestAddresses } from "@/lib/address-suggest";

const windows = new Map<string, { count: number; startedAt: number }>();

function clientKey(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anon"
  );
}

function allow(key: string) {
  const now = Date.now();
  const current = windows.get(key);
  if (!current || now - current.startedAt > 10_000) {
    windows.set(key, { count: 1, startedAt: now });
    return true;
  }
  current.count += 1;
  return current.count <= 24;
}

export async function GET(request: Request) {
  if (!allow(clientKey(request))) {
    return NextResponse.json({ error: "Too many lookups. Try again in a moment." }, { status: 429 });
  }

  const q = new URL(request.url).searchParams.get("q") ?? "";
  const suggestions = await suggestAddresses(q);
  return NextResponse.json({ suggestions });
}
