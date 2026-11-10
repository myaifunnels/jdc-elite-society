import { CalendarDays, SquareArrowOutUpRight } from "lucide-react";
import Link from "next/link";

import { WebinarAdminActions } from "@/components/dashboard/webinar-admin-actions";
import { WebinarAvatarRow } from "@/components/webinars/webinar-avatar-row";
import { EpisodeThumb } from "@/components/webinars/webinar-thumb";
import type { WebinarRecord } from "@/lib/webinars";
import type { WebinarRegistrant } from "@/lib/webinar-registrants-store";

function formatDateTimeLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "No date set";
  const datePart = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  return `${datePart} · ${timePart} Manila Time`;
}

/** The "Latest Lesson" hero: the featured webinar's thumbnail and details side-by-side, with the
 * real registrant avatar row and icon-only admin actions below — the admin-side mirror of the
 * public /webinars hero. There is no video-hosting/replay system in this codebase, so instead of
 * a fake "Play" button this links out to the real public page where the session actually lives. */
export function WebinarAdminHero({
  webinar,
  registrants,
}: {
  webinar: WebinarRecord;
  registrants: WebinarRegistrant[];
}) {
  const confirmedRegistrants = registrants.filter((item) => item.status === "confirmed");

  return (
    <section className="card-surface overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[1.1fr_1fr]">
        <div className="relative min-h-[220px] sm:min-h-[300px] lg:min-h-full">
          <EpisodeThumb webinar={webinar} className="absolute inset-0 h-full w-full" />
          <div
            aria-hidden
            className="absolute inset-0 [background:linear-gradient(90deg,rgba(2,4,10,0.05)_0%,rgba(2,4,10,0.55)_100%),linear-gradient(0deg,rgba(2,4,10,0.55)_0%,transparent_45%)] lg:[background:linear-gradient(90deg,rgba(2,4,10,0.1)_0%,rgba(2,4,10,0.75)_100%)]"
          />
          <span className="absolute left-4 top-4 rounded-full border border-white/25 bg-black/40 px-3 py-1.5 text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-white backdrop-blur-md">
            Latest lesson
          </span>
        </div>

        <div className="flex flex-col gap-4 p-6 sm:p-8">
          <p className="eyebrow m-0 !tracking-[0.12em] text-[0.68rem]">
            {webinar.seasonLabel || "Season 1"} &middot; Episode {webinar.episodeNumber}
          </p>

          <h2
            className="m-0 text-[clamp(1.5rem,2.6vw,2.1rem)] leading-[1.05] tracking-[-0.03em]"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            {webinar.title || "Untitled webinar"}
          </h2>

          {webinar.tagline ? <p className="m-0 text-sm font-bold text-[var(--foreground)]">{webinar.tagline}</p> : null}
          {webinar.description ? (
            <p className="m-0 text-sm leading-relaxed text-[var(--muted)]">{webinar.description}</p>
          ) : null}

          <p className="m-0 flex items-center gap-2 text-sm font-semibold text-[var(--muted)]">
            <CalendarDays aria-hidden size={16} className="text-[var(--brand)]" />
            {formatDateTimeLabel(webinar.scheduledAt)} &middot; Hosted by {webinar.hostName || "Coach JDC"}
          </p>

          {confirmedRegistrants.length > 0 ? (
            <div className="w-fit rounded-full border border-[var(--line)] bg-black/20 px-3 py-2">
              <WebinarAvatarRow
                registrants={confirmedRegistrants.map((item) => ({ name: item.name, photoUrl: item.photoUrl }))}
              />
            </div>
          ) : (
            <p className="m-0 text-xs font-semibold text-[var(--muted)]">No registrants yet.</p>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-3">
            <Link
              href="/webinars"
              target="_blank"
              rel="noreferrer"
              className="button-secondary pressable inline-flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.04em]"
            >
              <SquareArrowOutUpRight aria-hidden size={14} />
              View public page
            </Link>
          </div>

          <div className="mt-1 border-t border-[var(--line)] pt-4">
            <WebinarAdminActions webinar={webinar} registrants={registrants} />
          </div>
        </div>
      </div>
    </section>
  );
}
