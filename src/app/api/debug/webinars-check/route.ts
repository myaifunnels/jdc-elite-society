import { NextResponse } from "next/server";

import { getFeaturedWebinar, listWebinars } from "@/lib/webinars-store";
import { listPendingOverflowRegistrants, listRegistrants } from "@/lib/webinar-registrants-store";

/**
 * TEMPORARY diagnostic route to find the exact cause of a production-only error on
 * /dashboard/webinars that couldn't be reproduced locally (no DATABASE_URL in dev) and whose
 * real message React redacts in production error boundaries. Runs the same data + shape checks
 * the admin page does, step by step, and reports exactly which step (if any) throws. No auth
 * required so it can be hit directly for debugging — DELETE THIS FILE once the bug is found.
 */
export async function GET() {
  const steps: Array<{ step: string; ok: boolean; detail?: unknown }> = [];

  let webinars: Awaited<ReturnType<typeof listWebinars>> = [];
  try {
    webinars = await listWebinars();
    steps.push({
      step: "listWebinars",
      ok: true,
      detail: webinars.map((w) => ({
        id: w.id,
        title: w.title,
        scheduledAt: w.scheduledAt,
        totalSeats: w.totalSeats,
        thumbnailUrl: w.thumbnailUrl ? "(set)" : "(empty)",
      })),
    });
  } catch (error) {
    steps.push({ step: "listWebinars", ok: false, detail: describeError(error) });
    return NextResponse.json({ steps });
  }

  try {
    const featured = await getFeaturedWebinar();
    steps.push({
      step: "getFeaturedWebinar",
      ok: true,
      detail: featured ? { id: featured.id, title: featured.title } : null,
    });
  } catch (error) {
    steps.push({ step: "getFeaturedWebinar", ok: false, detail: describeError(error) });
  }

  try {
    const pending = await listPendingOverflowRegistrants();
    steps.push({ step: "listPendingOverflowRegistrants", ok: true, detail: pending.length });
  } catch (error) {
    steps.push({ step: "listPendingOverflowRegistrants", ok: false, detail: describeError(error) });
  }

  for (const webinar of webinars) {
    try {
      const registrants = await listRegistrants(webinar.id);
      steps.push({
        step: `listRegistrants(${webinar.id})`,
        ok: true,
        detail: registrants.map((r) => ({
          id: r.id,
          name: r.name,
          status: r.status,
          tier: r.tier,
          photoUrl: r.photoUrl ? "(set)" : "(empty)",
        })),
      });
    } catch (error) {
      steps.push({ step: `listRegistrants(${webinar.id})`, ok: false, detail: describeError(error) });
    }
  }

  return NextResponse.json({ steps });
}

function describeError(error: unknown) {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack, name: error.name };
  }
  return { message: String(error) };
}
