import { CalendarDays, Video } from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
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
        <div className="sms-template-list">
          {entries.map(({ registrant, webinar }) => (
            <article key={registrant.id} className="sms-template-card">
              <div className="sms-template-card-head">
                <div>
                  <strong>{webinar.title}</strong>
                  <p className="flex items-center gap-2">
                    <CalendarDays aria-hidden size={14} className="text-[var(--brand)]" />
                    {formatDateTimeLabel(webinar.scheduledAt)} &middot; GMT+8
                  </p>
                </div>
                <StatusPill status={registrant.status} />
              </div>
              <p className="m-0 text-xs text-[var(--muted)]">
                Seat type: {registrant.tier === "paid_overflow" ? "Overflow (paid)" : "Free"}
              </p>
              <Link
                href="/webinars"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--brand)]"
              >
                <Video aria-hidden size={14} />
                View webinar details
              </Link>
            </article>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
