import { CalendarDays, Video } from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ZoomLogo } from "@/components/dashboard/integration-logos";
import { EpisodeThumb } from "@/components/webinars/webinar-thumb";
import { requireCapability } from "@/lib/session";
import { getWebinar, listWebinars } from "@/lib/webinars-store";
import { listRegistrantsByUserId, type WebinarRegistrant } from "@/lib/webinar-registrants-store";
import { WEBINAR_ZOOM_MEETING_ID, WEBINAR_ZOOM_PASSCODE, type WebinarRecord } from "@/lib/webinars";

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

/** Upcoming webinars this person hasn't registered for yet, soonest first — so the page always
 * has something to show them even with zero registrations, instead of a dead end. */
function availableWebinars(allWebinars: WebinarRecord[], registeredWebinarIds: Set<string>) {
  const now = Date.now();
  return allWebinars
    .filter((webinar) => !registeredWebinarIds.has(webinar.id) && new Date(webinar.scheduledAt).getTime() >= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
}

/** Every webinar with a replay available, newest first — replays are open to anyone (same as the
 * public /webinars library), not gated behind having registered, so this covers a member who
 * missed the live session entirely. Excludes anything already shown with its own "Watch replay"
 * button in "Your registrations" to avoid listing the same episode twice. */
function replayLibrary(allWebinars: WebinarRecord[], confirmedWebinarIds: Set<string>) {
  return allWebinars
    .filter((webinar) => webinar.replayUrl && !confirmedWebinarIds.has(webinar.id))
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
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

  const registeredWebinarIds = new Set(entries.map((entry) => entry.webinar.id));
  const confirmedWebinarIds = new Set(
    entries.filter((entry) => entry.registrant.status === "confirmed").map((entry) => entry.webinar.id),
  );
  const allWebinars = await listWebinars();
  const upNext = availableWebinars(allWebinars, registeredWebinarIds);
  const replays = replayLibrary(allWebinars, confirmedWebinarIds);

  return (
    <DashboardShell
      title="Webinars"
      description="Every webinar you've registered for, what's coming up next, and replays you can watch anytime."
    >
      {entries.length === 0 && upNext.length === 0 && replays.length === 0 ? (
        <div className="card-surface p-8 text-center text-[var(--muted)]">
          <p className="m-0">No webinars yet — check back soon.</p>
          <Link href="/webinars" className="button-primary pressable mt-4 inline-flex">
            Browse webinars
          </Link>
        </div>
      ) : null}

      {entries.length > 0 ? (
        <section className="grid gap-3">
          <h3 className="m-0 text-lg font-bold tracking-[-0.02em]">Your registrations</h3>
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
                    <div className="grid gap-1.5">
                      <Link
                        href={webinar.zoomLink}
                        target="_blank"
                        rel="noreferrer"
                        className="button-primary pressable inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-extrabold"
                      >
                        <ZoomLogo size={18} />
                        Join via Zoom
                      </Link>
                      <p className="m-0 text-center text-xs text-[var(--muted)]">
                        Meeting ID: <strong className="text-sm">{WEBINAR_ZOOM_MEETING_ID}</strong> &middot; Passcode:{" "}
                        <strong className="text-sm">{WEBINAR_ZOOM_PASSCODE}</strong>
                      </p>
                    </div>
                  ) : null}
                  {registrant.status === "confirmed" && webinar.replayUrl ? (
                    <Link
                      href={`/webinars/${webinar.id}/replay`}
                      className="button-secondary pressable inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-extrabold"
                    >
                      <Video aria-hidden size={16} />
                      Watch replay
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
        </section>
      ) : null}

      {upNext.length > 0 ? (
        <section className="mt-8 grid gap-3">
          <h3 className="m-0 text-lg font-bold tracking-[-0.02em]">Upcoming &mdash; open to join</h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upNext.map((webinar) => (
              <article key={webinar.id} className="card-surface interactive-card flex flex-col overflow-hidden">
                <EpisodeThumb webinar={webinar} className="h-36 w-full" />
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <strong className="text-[1rem] leading-snug">{webinar.title}</strong>
                  <p className="m-0 flex items-center gap-2 text-xs text-[var(--muted)]">
                    <CalendarDays aria-hidden size={14} className="text-[var(--brand)]" />
                    {formatDateTimeLabel(webinar.scheduledAt)} &middot; Manila Time
                  </p>
                  <Link
                    href="/webinars"
                    className="button-primary pressable mt-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-extrabold"
                  >
                    Reserve my seat
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {replays.length > 0 ? (
        <section className="mt-8 grid gap-3">
          <h3 className="m-0 text-lg font-bold tracking-[-0.02em]">Replays</h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {replays.map((webinar) => (
              <article key={webinar.id} className="card-surface interactive-card flex flex-col overflow-hidden">
                <EpisodeThumb webinar={webinar} className="h-36 w-full" />
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <strong className="text-[1rem] leading-snug">{webinar.title}</strong>
                  <p className="m-0 flex items-center gap-2 text-xs text-[var(--muted)]">
                    <CalendarDays aria-hidden size={14} className="text-[var(--brand)]" />
                    {formatDateTimeLabel(webinar.scheduledAt)} &middot; Manila Time
                  </p>
                  <Link
                    href={`/webinars/${webinar.id}/replay`}
                    className="button-secondary pressable mt-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-extrabold"
                  >
                    <Video aria-hidden size={16} />
                    Watch replay
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </DashboardShell>
  );
}
