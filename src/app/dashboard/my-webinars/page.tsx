import { CalendarDays, Video } from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ZoomLogo } from "@/components/dashboard/integration-logos";
import { EpisodeThumb } from "@/components/webinars/webinar-thumb";
import { requireCapability } from "@/lib/session";
import { getWebinar } from "@/lib/webinars-store";
import { listRegistrantsByUserId, type WebinarRegistrant } from "@/lib/webinar-registrants-store";
import type { WebinarRecord } from "@/lib/webinars";

function formatDateTimeLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function StatusPill({ status }: { status: WebinarRegistrant["status"] }) {
  if (status === "confirmed") {
    return <span className="status-pill is-verified">Confirmed</span>;
  }
  if (status === "rejected") {
    return <span className="status-pill is-rejected">Rejected</span>;
  }
  return <span className="status-pill is-quiet">Pending overflow review</span>;
}

export default async function MyWebinarsPage() {
  const { user } = await requireCapability("myWebinars");
  const registrants = await listRegistrantsByUserId(user.id, user.email);

  const webinars = await Promise.all(
    registrants.map(async (registrant) => ({
      registrant,
      webinar: await getWebinar(registrant.webinarId),
    })),
  );
  const entries = webinars.filter(
    (entry): entry is { registrant: WebinarRegistrant; webinar: WebinarRecord } => Boolean(entry.webinar),
  );

  return (
    <DashboardShell title="Webinars" description="Every webinar you've registered for, and your seat status.">
      {entries.length === 0 ? (
        <div className="card-surface p-8 text-center text-[var(--muted)]">
          <p className="m-0">You haven&rsquo;t registered for any webinars yet.</p>
          <Link href="/webinars" className="button-primary pressable mt-4 inline-flex">
            Browse webinars
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map(({ registrant, webinar }) => (
            <article
              key={registrant.id}
              className="card-surface interactive-card flex flex-col overflow-hidden"
            >
              <EpisodeThumb webinar={webinar} className="h-36 w-full" />
              <div className="flex flex-1 flex-col gap-2 p-5">
                <div className="flex items-start justify-between gap-2">
                  <strong className="text-[1rem] leading-snug">{webinar.title}</strong>
                  <StatusPill status={registrant.status} />
                </div>
                <p className="m-0 flex items-center gap-2 text-xs text-[var(--muted)]">
                  <CalendarDays aria-hidden size={14} className="text-[var(--brand)]" />
                  {formatDateTimeLabel(webinar.scheduledAt)} &middot; Manila Time
                </p>
                <p className="m-0 text-xs text-[var(--muted)]">
                  Seat type: {registrant.tier === "paid_overflow" ? "Overflow (paid)" : "Free"}
                </p>
                <div className="mt-auto grid gap-2 pt-3">
                  {registrant.status === "confirmed" && webinar.zoomLink ? (
                    <Link
                      href={webinar.zoomLink}
                      target="_blank"
                      rel="noreferrer"
                      className="button-primary pressable inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-extrabold"
                    >
                      <ZoomLogo size={18} />
                      Join via Zoom
                    </Link>
                  ) : null}
                  <Link
                    href="/webinars"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--brand)]"
                  >
                    <Video aria-hidden size={14} />
                    View webinar details
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
