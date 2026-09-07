import type { Metadata } from "next";
import { CalendarDays, Video } from "lucide-react";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ZoomLogo } from "@/components/dashboard/integration-logos";
import { WebinarAvatarRow } from "@/components/webinars/webinar-avatar-row";
import { WebinarCountdown } from "@/components/webinars/webinar-countdown";
import { WebinarParticles } from "@/components/webinars/webinar-particles";
import { WebinarRegisterPanel } from "@/components/webinars/webinar-register-panel";
import { EpisodeThumb } from "@/components/webinars/webinar-thumb";
import { getSessionUser } from "@/lib/session";
import { WEBINAR_OVERFLOW_PRICE, formatWebinarDateLabel, formatWebinarTimeLabel } from "@/lib/webinars";
import { getFeaturedWebinar, listWebinars } from "@/lib/webinars-store";
import { findRegistrantByUserAndWebinar, getFreeSeatsLeft, listRegistrants } from "@/lib/webinar-registrants-store";

export const metadata: Metadata = {
  title: "Webinars | Coach JDC",
  description:
    "Join Coach JDC's live webinars on network marketing, business systems, leadership, and building income with discipline.",
  alternates: { canonical: "/webinars" },
};

const formatDateLabel = formatWebinarDateLabel;
const formatTimeLabel = formatWebinarTimeLabel;

function SeatsPill({ freeSeatsLeft }: { freeSeatsLeft: number }) {
  if (freeSeatsLeft <= 0) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-400/15 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.06em] text-amber-200 backdrop-blur-md">
        Fully booked &middot; ₱{WEBINAR_OVERFLOW_PRICE} overflow seats available
      </span>
    );
  }

  const isCritical = freeSeatsLeft <= 10;
  const isLow = !isCritical && freeSeatsLeft <= 20;
  const tone = isCritical
    ? "border-red-300/40 bg-red-400/15 text-red-200"
    : isLow
      ? "border-orange-300/40 bg-orange-400/15 text-orange-200"
      : "border-emerald-300/30 bg-emerald-400/10 text-emerald-200";
  const dotTone = isCritical ? "bg-red-300" : isLow ? "bg-orange-300" : "bg-emerald-300";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-extrabold uppercase tracking-[0.06em] backdrop-blur-md ${tone}`}
    >
      <i aria-hidden className={`inline-block h-1.5 w-1.5 rounded-full ${dotTone}`} />
      {freeSeatsLeft} free {freeSeatsLeft === 1 ? "seat" : "seats"} left
    </span>
  );
}

/** Scarcity bar showing how full the event is. Green while seats are plentiful, orange once
 * 20 or fewer free seats remain, red once 10 or fewer remain (or the event is fully booked) —
 * with a looping shimmer sweep across the filled portion so it reads as "live" urgency rather
 * than a static stat. */
function SeatsProgressBar({ freeSeatsLeft, totalSeats }: { freeSeatsLeft: number; totalSeats: number }) {
  const seatsTaken = Math.max(0, totalSeats - Math.max(freeSeatsLeft, 0));
  const filledPercent = totalSeats > 0 ? Math.min(100, Math.round((seatsTaken / totalSeats) * 100)) : 100;
  const level = freeSeatsLeft <= 10 ? "red" : freeSeatsLeft <= 20 ? "orange" : "green";

  return (
    <div className="webinar-seats-progress" role="img" aria-label={`${seatsTaken} of ${totalSeats} seats reserved`}>
      <div className="webinar-seats-progress-track">
        <div
          className={`webinar-seats-progress-fill is-${level}`}
          style={{ width: `${Math.max(filledPercent, 3)}%` }}
        >
          <span aria-hidden className="webinar-seats-progress-shimmer" />
        </div>
      </div>
      <p className="webinar-seats-progress-label">
        {seatsTaken} of {totalSeats} seats reserved
      </p>
    </div>
  );
}

export default async function WebinarsPage() {
  const [webinars, featured] = await Promise.all([listWebinars(), getFeaturedWebinar()]);
  const otherEpisodes = featured ? webinars.filter((item) => item.id !== featured.id) : webinars;

  const [freeSeatsLeft, registrants, sessionUser] = featured
    ? await Promise.all([getFreeSeatsLeft(featured), listRegistrants(featured.id), getSessionUser()])
    : [0, [], null];
  const confirmedRegistrants = registrants.filter((item) => item.status === "confirmed");
  const myRegistration =
    featured && sessionUser
      ? await findRegistrantByUserAndWebinar(featured.id, sessionUser.id, sessionUser.email)
      : null;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        {featured ? (
          <section className="relative overflow-hidden border-b border-[var(--line)]" aria-labelledby="featured-webinar">
            <div className="relative min-h-[640px] w-full sm:min-h-[720px]">
              {featured.thumbnailUrl ? (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url('${featured.thumbnailUrl}')` }}
                  role="img"
                  aria-label={featured.title}
                />
              ) : (
                <div className="absolute inset-0 bg-[linear-gradient(150deg,color-mix(in_srgb,var(--brand)_32%,#050b18)_0%,#050b18_75%)]">
                  <div className="absolute inset-0 opacity-40 [background:radial-gradient(65%_65%_at_25%_15%,rgba(255,255,255,0.14),transparent)]" />
                </div>
              )}

              {/* Netflix-style hero scrim: dominant left-to-right darkening (strongly dark over the
                  text/registration column on the left, fading to a much clearer view of the
                  background image on the right), plus a lighter bottom-anchored vertical layer so
                  the countdown/register button — which sit near the bottom — stay legible. Same
                  scrim code path runs for both the real thumbnail and the GradientThumb fallback
                  above so there's no visual seam if an admin adds a thumbnail later. */}
              <div
                aria-hidden
                className="absolute inset-0 [background:linear-gradient(90deg,rgba(2,4,10,0.97)_0%,rgba(2,4,10,0.86)_32%,rgba(2,4,10,0.48)_58%,rgba(2,4,10,0.12)_82%,rgba(2,4,10,0.02)_100%),linear-gradient(0deg,rgba(2,4,10,0.7)_0%,rgba(2,4,10,0.32)_28%,transparent_58%)]"
              />

              <WebinarParticles />

              <div className="container-shell relative flex min-h-[640px] flex-col justify-end gap-6 py-12 sm:min-h-[720px] sm:py-16">
                <div className="fade-up flex flex-wrap items-center gap-3">
                  <p className="eyebrow m-0 text-white/70">Latest webinar</p>
                  <SeatsPill freeSeatsLeft={freeSeatsLeft} />
                </div>

                <h1
                  className="fade-up-delay-1 max-w-3xl text-[clamp(2.4rem,5.6vw,4.2rem)] leading-[0.98] tracking-[-0.045em] text-white"
                  style={{ fontFamily: "var(--font-display), Georgia, serif" }}
                >
                  {featured.title}
                </h1>

                <p className="fade-up-delay-1 m-0 text-sm font-bold text-white/85">
                  Hosted by {featured.hostName || "Coach JDC"}
                </p>

                <div
                  className="fade-up-delay-1 flex flex-wrap items-stretch gap-3 rounded-2xl border border-white/15 bg-white/[0.07] p-4 backdrop-blur-xl sm:inline-flex sm:w-auto"
                  aria-label="Event date and time"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl border border-white/15 bg-black/30 text-[var(--brand)]">
                      <CalendarDays aria-hidden className="w-5" />
                    </span>
                    <div>
                      <p className="m-0 text-[0.65rem] font-extrabold uppercase tracking-[0.1em] text-white/50">Date</p>
                      <p className="m-0 text-base font-extrabold text-white sm:text-lg">
                        {formatDateLabel(featured.scheduledAt)}
                      </p>
                    </div>
                  </div>
                  <div aria-hidden className="hidden w-px self-stretch bg-white/15 sm:block" />
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl border border-white/15 bg-black/30 text-[var(--brand)]">
                      <Video aria-hidden className="w-5" />
                    </span>
                    <div>
                      <p className="m-0 text-[0.65rem] font-extrabold uppercase tracking-[0.1em] text-white/50">Time</p>
                      <p className="m-0 text-base font-extrabold text-white sm:text-lg">
                        {formatTimeLabel(featured.scheduledAt)} &middot; Manila Time
                      </p>
                    </div>
                  </div>
                  <div aria-hidden className="hidden w-px self-stretch bg-white/15 sm:block" />
                  <div className="flex items-center gap-3">
                    <ZoomLogo size={44} />
                    <div>
                      <p className="m-0 text-[0.65rem] font-extrabold uppercase tracking-[0.1em] text-white/50">Where</p>
                      <p className="m-0 text-base font-extrabold text-white sm:text-lg">Live on Zoom</p>
                    </div>
                  </div>
                </div>

                {featured.tagline ? (
                  <p className="fade-up-delay-1 m-0 max-w-xl text-[1.05rem] font-bold text-white">
                    {featured.tagline}
                  </p>
                ) : null}
                {featured.description ? (
                  <p className="fade-up-delay-1 m-0 max-w-xl leading-relaxed text-white/75">{featured.description}</p>
                ) : null}

                <div className="fade-up-delay-2">
                  <WebinarCountdown scheduledAt={featured.scheduledAt} />
                </div>

                <div className="fade-up-delay-2 w-full max-w-sm">
                  <SeatsProgressBar freeSeatsLeft={freeSeatsLeft} totalSeats={featured.totalSeats} />
                </div>

                <div className="fade-up-delay-2 flex flex-col gap-4 sm:flex-row sm:items-start">
                  <WebinarRegisterPanel
                    webinarId={featured.id}
                    freeSeatsLeft={freeSeatsLeft}
                    overflowPrice={WEBINAR_OVERFLOW_PRICE}
                    joinUrl={featured.zoomLink || undefined}
                    existingRegistration={
                      myRegistration ? { tier: myRegistration.tier, status: myRegistration.status } : null
                    }
                  />
                  <div className="flex flex-col gap-3">
                    {confirmedRegistrants.length > 0 ? (
                      <WebinarAvatarRow
                        registrants={confirmedRegistrants.map((item) => ({
                          name: item.name,
                          photoUrl: item.photoUrl,
                        }))}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="section-space">
            <div className="container-shell fade-up">
              <p className="card-surface p-8 text-center text-[var(--muted)]">
                No webinars scheduled yet — check back soon.
              </p>
            </div>
          </section>
        )}

        {otherEpisodes.length > 0 ? (
          <section className="section-space border-t border-[var(--line)]" aria-labelledby="all-episodes">
            <div className="container-shell">
              <div className="fade-up mb-6">
                <p className="eyebrow">Browse the library</p>
                <h2 id="all-episodes" className="mt-2 text-[clamp(1.6rem,3vw,2.2rem)] tracking-[-0.03em]">
                  All episodes
                </h2>
              </div>

              <div className="fade-up-delay-1 flex gap-5 overflow-x-auto pb-4" style={{ scrollbarWidth: "thin" }}>
                {otherEpisodes.map((webinar) => (
                  <article
                    key={webinar.id}
                    className="card-surface interactive-card flex w-[280px] flex-none flex-col overflow-hidden hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.28)]"
                  >
                    <EpisodeThumb webinar={webinar} className="h-40 w-full" />
                    <div className="flex flex-1 flex-col p-5">
                      <p className="eyebrow m-0 !tracking-[0.12em] text-[0.65rem]">
                        {webinar.seasonLabel || "Season 1"} &middot; Ep {webinar.episodeNumber}
                      </p>
                      <h3 className="mt-2 mb-2 text-[1.05rem] font-bold leading-snug tracking-[-0.02em]">
                        {webinar.title}
                      </h3>
                      <p className="m-0 flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
                        <CalendarDays aria-hidden className="w-3.5 text-[var(--brand)]" />
                        {formatDateLabel(webinar.scheduledAt)}
                      </p>
                      {webinar.replayUrl ? (
                        <Link
                          href={webinar.replayUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold text-[var(--brand)]"
                        >
                          <Video aria-hidden className="w-3.5" /> Watch replay
                        </Link>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
