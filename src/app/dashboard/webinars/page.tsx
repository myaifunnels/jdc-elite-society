import { Plus } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { WebinarAdminGridCard } from "@/components/dashboard/webinar-admin-grid-card";
import { WebinarAdminHero } from "@/components/dashboard/webinar-admin-hero";
import { WebinarAdminUpcomingRow } from "@/components/dashboard/webinar-admin-upcoming-row";
import { WebinarFormModal } from "@/components/dashboard/webinar-form-modal";
import { WebinarOverflowCard } from "@/components/dashboard/webinar-overflow-card";
import { requireCapability } from "@/lib/session";
import { getFeaturedWebinar, listWebinars } from "@/lib/webinars-store";
import { listPendingOverflowRegistrants, listRegistrants } from "@/lib/webinar-registrants-store";
import type { WebinarRegistrant } from "@/lib/webinar-registrants-store";
import type { WebinarRecord } from "@/lib/webinars";

function upcomingWebinars(webinars: WebinarRecord[], featuredId: string | undefined) {
  const now = Date.now();
  return webinars
    .filter((webinar) => webinar.id !== featuredId && new Date(webinar.scheduledAt).getTime() >= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
}

export default async function WebinarsAdminPage() {
  await requireCapability("webinars");

  // Every function called here already has its own internal try/catch that falls back to an
  // empty/cached result rather than throwing — but Promise.all still rejects the whole page if
  // any single one of them somehow does throw, and one bad registrant lookup out of many
  // shouldn't take the entire admin page down. Promise.allSettled + safe defaults means a
  // transient failure degrades to "this one section is empty" instead of a hard crash.
  const [webinarsResult, featuredResult, pendingOverflowResult] = await Promise.allSettled([
    listWebinars(),
    getFeaturedWebinar(),
    listPendingOverflowRegistrants(),
  ]);

  const webinars = webinarsResult.status === "fulfilled" ? webinarsResult.value : [];
  const featured = featuredResult.status === "fulfilled" ? featuredResult.value : null;
  const pendingOverflow = pendingOverflowResult.status === "fulfilled" ? pendingOverflowResult.value : [];

  if (webinarsResult.status === "rejected") {
    console.error("Failed to load webinars for admin page", webinarsResult.reason);
  }
  if (featuredResult.status === "rejected") {
    console.error("Failed to load the featured webinar for admin page", featuredResult.reason);
  }
  if (pendingOverflowResult.status === "rejected") {
    console.error("Failed to load pending overflow registrants for admin page", pendingOverflowResult.reason);
  }

  const registrantEntries = await Promise.allSettled(
    webinars.map(async (webinar) => [webinar.id, await listRegistrants(webinar.id)] as const),
  );
  const registrantsByWebinarId = new Map<string, WebinarRegistrant[]>(
    registrantEntries.map((entry, index) =>
      entry.status === "fulfilled" ? entry.value : ([webinars[index].id, []] as const),
    ),
  );
  const titleByWebinarId = new Map(webinars.map((webinar) => [webinar.id, webinar.title]));

  const upcoming = upcomingWebinars(webinars, featured?.id);

  return (
    <DashboardShell
      title="Webinars"
      description="Manage the episodes shown on the public /webinars page — the featured hero, all-episode library, and each one's CTA button."
      actions={
        <WebinarFormModal
          trigger={(open) => (
            <button
              type="button"
              className="button-primary pressable inline-flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold"
              onClick={open}
            >
              <Plus aria-hidden size={16} />
              Schedule webinar
            </button>
          )}
        />
      }
    >
      <div className="grid gap-8">
        <section className="grid gap-2">
          <p className="eyebrow m-0">Webinar library</p>
          <h2 className="m-0 text-[clamp(1.4rem,2.4vw,1.9rem)] tracking-[-0.03em]" style={{ fontFamily: "var(--font-display), Georgia, serif" }}>
            Netflix-style sessions, real attendance
          </h2>
          <p className="m-0 max-w-2xl text-sm text-[var(--muted)]">
            Every episode registrants actually see on the public page, plus the real registration
            numbers behind each one — no fabricated view counts, just who signed up and who&rsquo;s
            still waiting on payment review.
          </p>
        </section>

        {featured ? (
          <WebinarAdminHero webinar={featured} registrants={registrantsByWebinarId.get(featured.id) ?? []} />
        ) : (
          <p className="card-surface p-8 text-center text-sm text-[var(--muted)]">
            No webinars yet. Schedule your first one above.
          </p>
        )}

        <section className="grid gap-3">
          <h3 className="m-0 text-lg font-bold tracking-[-0.02em]">Upcoming</h3>
          {upcoming.length > 0 ? (
            <div className="grid gap-3">
              {upcoming.map((webinar) => (
                <WebinarAdminUpcomingRow
                  key={webinar.id}
                  webinar={webinar}
                  registrants={registrantsByWebinarId.get(webinar.id) ?? []}
                />
              ))}
            </div>
          ) : (
            <p className="m-0 text-sm text-[var(--muted)]">No upcoming webinars scheduled yet.</p>
          )}
        </section>

        <section className="grid gap-3">
          <h3 className="m-0 text-lg font-bold tracking-[-0.02em]">All episodes ({webinars.length})</h3>
          {webinars.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {webinars.map((webinar) => (
                <WebinarAdminGridCard
                  key={webinar.id}
                  webinar={webinar}
                  registrants={registrantsByWebinarId.get(webinar.id) ?? []}
                />
              ))}
            </div>
          ) : (
            <p className="m-0 text-sm text-[var(--muted)]">No webinars yet. Schedule your first one above.</p>
          )}
        </section>

        <section className="grid gap-3">
          <h3 className="m-0 text-lg font-bold tracking-[-0.02em]">
            Pending overflow payments ({pendingOverflow.length})
          </h3>
          {pendingOverflow.length ? (
            <div className="sms-template-list">
              {pendingOverflow.map((registrant) => (
                <WebinarOverflowCard
                  key={registrant.id}
                  registrant={registrant}
                  webinarTitle={titleByWebinarId.get(registrant.webinarId) ?? "Unknown webinar"}
                />
              ))}
            </div>
          ) : (
            <p className="m-0 text-sm text-[var(--muted)]">No overflow payments waiting for review.</p>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
