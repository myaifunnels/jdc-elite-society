import { NextRequest, NextResponse } from "next/server";

import { sendDueWebinarReminders } from "@/lib/webinar-reminders";

/** The reminder sweep already runs automatically on an interval (see src/instrumentation.ts) as
 * long as the Next.js server process stays up, so nothing external needs to call this for the
 * feature to work. This route exists as a fallback: an external scheduler (e.g. a Render Cron
 * Job, or a third-party uptime/cron pinger) can hit it too, and the sweep is idempotent either
 * way — a stage is only ever sent once per registrant. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await sendDueWebinarReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Webinar reminder cron failed", error);
    return NextResponse.json({ ok: false, error: "Reminder sweep failed" }, { status: 500 });
  }
}
