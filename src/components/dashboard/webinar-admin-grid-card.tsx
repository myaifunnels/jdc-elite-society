import { CalendarDays } from "lucide-react";

import { WebinarAdminActions } from "@/components/dashboard/webinar-admin-actions";
import { WebinarAvatarRow } from "@/components/webinars/webinar-avatar-row";
import { EpisodeThumb } from "@/components/webinars/webinar-thumb";
import type { WebinarRecord } from "@/lib/webinars";
import type { WebinarRegistrant } from "@/lib/webinar-registrants-store";

function formatDateLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "No date set";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/** One tile in the "All episodes" grid — every webinar including the featured one, each with
 * real registered/pending-review numbers (never a fabricated "watched" metric — this codebase has
 * no view-tracking) and the same icon-only actions as the hero card. */
export function WebinarAdminGridCard({
  webinar,
  registrants,
}: {
  webinar: WebinarRecord;
  registrants: WebinarRegistrant[];
}) {
  const confirmedRegistrants = registrants.filter((item) => item.status === "confirmed");
  const pendingOverflowCount = registrants.filter(
    (item) => item.tier === "paid_overflow" && item.status === "pending",
  ).length;

  return (
    <article className="card-surface interactive-card flex flex-col overflow-hidden hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.28)]">
      <div className="relative">
        <EpisodeThumb webinar={webinar} className="h-36 w-full" />
        {webinar.isFeatured ? (
          <span className="status-pill is-verified absolute left-3 top-3">Featured</span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="eyebrow m-0 !tracking-[0.1em] text-[0.62rem]">
          {webinar.seasonLabel || "Season 1"} &middot; Ep {webinar.episodeNumber}
        </p>
        <h3 className="m-0 text-[0.98rem] font-bold leading-snug tracking-[-0.02em]">
          {webinar.title || "Untitled webinar"}
        </h3>
        <p className="m-0 flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)]">
          <CalendarDays aria-hidden size={13} className="text-[var(--brand)]" />
          {formatDateLabel(webinar.scheduledAt)}
        </p>

        {pendingOverflowCount > 0 ? (
          <p className="m-0 text-xs font-bold text-amber-500 dark:text-amber-300">
            {pendingOverflowCount} pending review
          </p>
        ) : null}

        {confirmedRegistrants.length > 0 ? (
          <WebinarAvatarRow
            registrants={confirmedRegistrants.map((item) => ({ name: item.name, photoUrl: item.photoUrl }))}
            max={4}
          />
        ) : (
          <p className="m-0 text-xs font-bold text-[var(--muted)]">0 registered</p>
        )}

        <div className="mt-auto border-t border-[var(--line)] pt-3">
          <WebinarAdminActions webinar={webinar} registrants={registrants} />
        </div>
      </div>
    </article>
  );
}
