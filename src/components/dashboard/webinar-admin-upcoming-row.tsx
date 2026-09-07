import { CalendarDays } from "lucide-react";

import { WebinarAdminActions } from "@/components/dashboard/webinar-admin-actions";
import { EpisodeThumb } from "@/components/webinars/webinar-thumb";
import type { WebinarRecord } from "@/lib/webinars";
import type { WebinarRegistrant } from "@/lib/webinar-registrants-store";

function formatDateTimeLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "No date set";
  const datePart = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "short",
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

/** A lighter list row for webinars that are scheduled but not the featured hero — used in the
 * "Upcoming" section between the hero and the full grid. */
export function WebinarAdminUpcomingRow({
  webinar,
  registrants,
}: {
  webinar: WebinarRecord;
  registrants: WebinarRegistrant[];
}) {
  const confirmedCount = registrants.filter((item) => item.status === "confirmed").length;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-black/10 p-3 sm:flex-row sm:items-center">
      <EpisodeThumb webinar={webinar} className="h-20 w-full flex-none rounded-xl sm:w-32" />
      <div className="flex flex-1 flex-col gap-1">
        <p className="eyebrow m-0 !tracking-[0.1em] text-[0.6rem]">
          {webinar.seasonLabel || "Season 1"} &middot; Ep {webinar.episodeNumber}
        </p>
        <p className="m-0 truncate text-sm font-bold">{webinar.title || "Untitled webinar"}</p>
        <p className="m-0 flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)]">
          <CalendarDays aria-hidden size={13} className="text-[var(--brand)]" />
          {formatDateTimeLabel(webinar.scheduledAt)} &middot; {confirmedCount} registered
        </p>
      </div>
      <WebinarAdminActions webinar={webinar} registrants={registrants} />
    </div>
  );
}
