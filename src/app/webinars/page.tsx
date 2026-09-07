import type { Metadata } from "next";
import { ArrowRight, CalendarDays, Users, Video } from "lucide-react";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import type { WebinarRecord } from "@/lib/webinars";
import { getFeaturedWebinar, listWebinars } from "@/lib/webinars-store";

export const metadata: Metadata = {
  title: "Webinars | Coach JDC",
  description:
    "Join Coach JDC's live webinars on network marketing, business systems, leadership, and building income with discipline.",
  alternates: { canonical: "/webinars" },
};

function formatDateLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTimeLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function GradientThumb({ webinar, className }: { webinar: WebinarRecord; className?: string }) {
  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden bg-[linear-gradient(150deg,color-mix(in_srgb,var(--brand)_38%,#050b18)_0%,#050b18_70%)] p-6 ${className ?? ""}`}
    >
      <div className="absolute inset-0 opacity-40 [background:radial-gradient(60%_60%_at_20%_10%,rgba(255,255,255,0.16),transparent)]" />
      <span className="relative rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-white/80 backdrop-blur-md">
        {webinar.seasonLabel || "Season 1"} &middot; Ep {webinar.episodeNumber}
      </span>
      <p className="relative m-0 text-lg font-bold leading-snug text-white">{webinar.title}</p>
    </div>
  );
}

function EpisodeThumb({ webinar, className }: { webinar: WebinarRecord; className?: string }) {
  if (webinar.thumbnailUrl) {
    return (
      <div
        className={`bg-cover bg-center ${className ?? ""}`}
        style={{ backgroundImage: `url('${webinar.thumbnailUrl}')` }}
        role="img"
        aria-label={webinar.title}
      />
    );
  }
  return <GradientThumb webinar={webinar} className={className} />;
}

export default async function WebinarsPage() {
  const [webinars, featured] = await Promise.all([listWebinars(), getFeaturedWebinar()]);
  const otherEpisodes = featured ? webinars.filter((item) => item.id !== featured.id) : webinars;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="section-space border-b border-[var(--line)]">
          <div className="container-shell fade-up">
            <p className="eyebrow">Coach JDC live training</p>
            <h1
              className="mt-4 max-w-3xl text-[clamp(2.6rem,6vw,4.6rem)] leading-[0.98] tracking-[-0.045em]"
              style={{ fontFamily: "var(--font-display), Georgia, serif" }}
            >
              Webinars built for people ready to do the work.
            </h1>
            <p className="mt-5 max-w-xl text-[var(--muted)] text-[clamp(1rem,1.6vw,1.15rem)] leading-relaxed">
              Practical live sessions on business, leadership, and building income with a system you can repeat.
            </p>
          </div>
        </section>

        {featured ? (
          <section className="section-space" aria-labelledby="featured-webinar">
            <div className="container-shell">
              <div className="fade-up mb-8 flex flex-wrap items-end justify-between gap-6">
                <div>
                  <p className="eyebrow">Latest webinar</p>
                  <h2 id="featured-webinar" className="mt-2 text-[clamp(1.8rem,3.6vw,2.6rem)] tracking-[-0.03em]">
                    {featured.seasonLabel || "Season 1"} &middot; Episode {featured.episodeNumber}
                  </h2>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--brand-soft)] px-4 py-2.5 text-sm font-bold text-[var(--foreground)]">
                  <i
                    aria-hidden
                    className="inline-block h-2 w-2 rounded-full bg-[var(--brand)] shadow-[0_0_0_0.3rem_var(--brand-soft)]"
                  />
                  Live online
                </span>
              </div>

              <article className="fade-up-delay-1 card-surface grid overflow-hidden md:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)]">
                <EpisodeThumb webinar={featured} className="relative min-h-[320px] md:min-h-[560px]" />

                <div className="flex flex-col justify-center p-8 md:p-14">
                  <p className="eyebrow m-0 !tracking-[0.14em] text-sm">
                    Hosted by {featured.hostName || "Coach JDC"}
                  </p>
                  <h3
                    className="mt-3 mb-2 text-[clamp(1.9rem,3.6vw,3rem)] leading-[1.05] tracking-[-0.04em]"
                    style={{ fontFamily: "var(--font-display), Georgia, serif" }}
                  >
                    {featured.title}
                  </h3>
                  {featured.tagline ? (
                    <p className="m-0 mb-3 text-[1.05rem] font-bold text-[var(--foreground)]">{featured.tagline}</p>
                  ) : null}
                  {featured.description ? (
                    <p className="m-0 text-[var(--muted)] leading-relaxed">{featured.description}</p>
                  ) : null}

                  <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm font-bold text-[var(--foreground)]">
                    <span className="flex items-center gap-2">
                      <CalendarDays aria-hidden className="w-4 text-[var(--brand)]" />
                      {formatDateLabel(featured.scheduledAt)}
                    </span>
                    <span className="flex items-center gap-2">
                      <Video aria-hidden className="w-4 text-[var(--brand)]" />
                      {formatTimeLabel(featured.scheduledAt)} &middot; Philippine Time (GMT+8)
                    </span>
                  </div>

                  {featured.hostTitle ? (
                    <p className="mt-4 text-sm text-[var(--muted)]">
                      {featured.hostName || "Coach JDC"} &middot; {featured.hostTitle}
                    </p>
                  ) : null}

                  {featured.ctaHref && featured.ctaLabel ? (
                    <Link
                      href={featured.ctaHref}
                      className="button-primary pressable mt-8 inline-flex min-h-[3.25rem] items-center justify-center gap-2 self-start px-6 text-sm font-extrabold"
                    >
                      {featured.ctaLabel} <ArrowRight aria-hidden className="w-4" />
                    </Link>
                  ) : null}

                  {featured.interestedCount > 0 ? (
                    <p className="mt-3 flex items-center gap-2 text-xs text-[var(--muted)]">
                      <Users aria-hidden className="w-3.5" />
                      {featured.interestedCount} people interested
                    </p>
                  ) : null}
                </div>
              </article>
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
                    className="card-surface flex w-[280px] flex-none flex-col overflow-hidden"
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
                      {webinar.ctaHref && webinar.ctaLabel ? (
                        <Link
                          href={webinar.ctaHref}
                          className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold text-[var(--brand)]"
                        >
                          {webinar.ctaLabel} <ArrowRight aria-hidden className="w-3.5" />
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
