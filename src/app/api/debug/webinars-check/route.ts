import { NextResponse } from "next/server";

import { WebinarAdminGridCard } from "@/components/dashboard/webinar-admin-grid-card";
import { WebinarAdminHero } from "@/components/dashboard/webinar-admin-hero";
import { getFeaturedWebinar, listWebinars } from "@/lib/webinars-store";
import { listPendingOverflowRegistrants, listRegistrants } from "@/lib/webinar-registrants-store";

/**
 * Manually walks a React element tree, calling each function component directly instead of
 * going through react-dom/server (which Next.js's App Router refuses to let route files import
 * transitively) or React's own reconciler (which JSX alone never triggers — <Foo/> only builds
 * an element description; Foo's body doesn't run until something actually renders it). This is
 * the only way, short of a real browser/SSR pass, to force nested child components to actually
 * execute so a throw deep in the tree surfaces here instead of staying invisible.
 * Skips any component whose displayName/function name suggests it uses hooks (a plain call
 * outside React's real render loop would violate the Rules of Hooks and throw its own unrelated
 * error) — WebinarAdminActions is the only such component in this tree.
 */
function walk(node: unknown, skip: Set<string>): void {
  if (node == null || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) walk(item, skip);
    return;
  }
  const el = node as { type?: unknown; props?: { children?: unknown } };
  if (typeof el.type === "function") {
    const name = el.type.name || "";
    if (skip.has(name)) return;
    const result = (el.type as (props: unknown) => unknown)((el as { props?: unknown }).props ?? {});
    walk(result, skip);
    return;
  }
  if (el.props?.children) walk(el.props.children, skip);
}

function renderDeep(label: string, element: unknown, steps: Array<{ step: string; ok: boolean; detail?: unknown }>) {
  try {
    walk(element, new Set(["WebinarAdminActions"]));
    steps.push({ step: label, ok: true });
  } catch (error) {
    steps.push({ step: label, ok: false, detail: describeError(error) });
  }
}

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

  // All the data operations above already succeeded, which means the crash is happening during
  // render, not data-fetching — and specifically somewhere React's real reconciler reaches that
  // plain JSX creation never would (JSX only builds an element description; a nested child's
  // function body doesn't execute until something actually walks the tree). Force that walk here.
  const featured = await getFeaturedWebinar();
  if (featured) {
    const registrants = await listRegistrants(featured.id);
    renderDeep("render WebinarAdminGridCard (deep)", WebinarAdminGridCard({ webinar: featured, registrants }), steps);
    renderDeep("render WebinarAdminHero (deep)", WebinarAdminHero({ webinar: featured, registrants }), steps);
  }

  return NextResponse.json({ steps });
}

function describeError(error: unknown) {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack, name: error.name };
  }
  return { message: String(error) };
}
