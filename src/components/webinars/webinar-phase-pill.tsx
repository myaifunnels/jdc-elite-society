"use client";

import type { ReactNode } from "react";

import { useWebinarPhase } from "@/components/webinars/webinar-countdown";
import { WebinarLiveBadge } from "@/components/webinars/webinar-live-badge";

/** The status pill beside the "Latest webinar" eyebrow: the seats pill while upcoming, a pulsing
 * "LIVE NOW" badge during the live window, and "Registration closed" after. Client-side so it
 * flips on its own while a visitor is on the page. */
export function WebinarPhasePill({
  scheduledAt,
  serverNow,
  upcoming,
}: {
  scheduledAt: string;
  serverNow: number;
  /** Rendered while the webinar hasn't started yet (the seats-left pill). */
  upcoming: ReactNode;
}) {
  const phase = useWebinarPhase(scheduledAt, serverNow);

  if (phase === "live") {
    return <WebinarLiveBadge label="Live now · Join the session" />;
  }
  if (phase === "closed") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.06em] text-white/85 backdrop-blur-md">
        Registration closed
      </span>
    );
  }
  return <>{upcoming}</>;
}
