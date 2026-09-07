import type { Metadata } from "next";
import { CalendarDays, PlayCircle, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WebinarAvatarRow } from "@/components/webinars/webinar-avatar-row";
import { WebinarCommentForm, WebinarCommentList } from "@/components/webinars/webinar-comments";
import { EpisodeThumb } from "@/components/webinars/webinar-thumb";
import { getSessionUser } from "@/lib/session";
import { getEmbeddableVideo } from "@/lib/video-embed";
import { listComments } from "@/lib/webinar-comments-store";
import { formatWebinarDateLabel, formatWebinarTimeLabel } from "@/lib/webinars";
import { getWebinar, listWebinars } from "@/lib/webinars-store";
import { listRegistrants } from "@/lib/webinar-registrants-store";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const webinar = await getWebinar(id);
  if (!webinar) {
    return { title: "Replay | Coach JDC" };
  }
  return {
    title: `${webinar.title} — Replay | Coach JDC`,
    description: webinar.tagline || webinar.description || undefined,
  };
}

export default async function WebinarReplayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const webinar = await getWebinar(id);

  if (!webinar || !webinar.replayUrl) {
    notFound();
  }

  const [allWebinars, registrants, comments, sessionUser] = await Promise.all([
    listWebinars(),
    listRegistrants(webinar.id),
    listComments(webinar.id),
    getSessionUser(),
  ]);
  const confirmedRegistrants = registrants.filter((item) => item.status === "confirmed");
  const upNext = allWebinars
    .filter((item) => item.id !== webinar.id)
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  const embed = getEmbeddableVideo(webinar.replayUrl);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="section-space">
        <div className="container-shell grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="fade-up min-w-0">
            <div className="replay-video-frame">
              {embed.type === "iframe" ? (
                <iframe
                  src={embed.src}
                  title={webinar.title}
                  className="replay-video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : embed.type === "video" ? (
                <video
                  src={embed.src}
                  controls
                  playsInline
                  preload="metadata"
                  poster={webinar.thumbnailUrl || undefined}
                  className="replay-video"
                />
              ) : (
                <Link href={embed.src} target="_blank" rel="noreferrer" className="replay-video replay-video-fallback">
                  <PlayCircle aria-hidden size={56} />
                  <span>Watch the replay</span>
                </Link>
              )}
            </div>

            <div className="mt-6 grid gap-3">
              <p className="eyebrow m-0">
                {webinar.seasonLabel || "Season 1"} &middot; Ep {webinar.episodeNumber} &middot; Replay
              </p>
              <h1 className="m-0 text-[clamp(1.6rem,3vw,2.4rem)] tracking-[-0.03em]">{webinar.title}</h1>

              <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-[var(--muted)]">
                <span className="flex items-center gap-2">
                  <CalendarDays aria-hidden size={16} className="text-[var(--brand)]" />
                  {formatWebinarDateLabel(webinar.scheduledAt)} &middot; {formatWebinarTimeLabel(webinar.scheduledAt)}
                </span>
                <span className="flex items-center gap-2">
                  <UserRound aria-hidden size={16} className="text-[var(--brand)]" />
                  {webinar.hostName || "Coach JDC"}
                </span>
              </div>

              {webinar.tagline ? <p className="m-0 text-base font-bold">{webinar.tagline}</p> : null}
              {webinar.description ? (
                <p className="m-0 leading-relaxed text-[var(--muted)]">{webinar.description}</p>
              ) : null}

              {confirmedRegistrants.length > 0 ? (
                <div className="mt-2">
                  <WebinarAvatarRow
                    registrants={confirmedRegistrants.map((item) => ({ name: item.name, photoUrl: item.photoUrl }))}
                    max={12}
                  />
                </div>
              ) : null}
            </div>

            <section className="webinar-comments-section">
              <h2 className="m-0 text-lg font-bold tracking-[-0.02em]">
                Comments {comments.length > 0 ? `(${comments.length})` : ""}
              </h2>
              <WebinarCommentForm
                webinarId={webinar.id}
                currentUser={sessionUser ? { name: sessionUser.name, photoUrl: sessionUser.facebookPhotoUrl } : null}
              />
              <WebinarCommentList comments={comments} />
            </section>
          </div>

          <aside className="fade-up-delay-1 grid content-start gap-3">
            <p className="eyebrow m-0">Up next</p>
            <div className="grid gap-3">
              {upNext.length === 0 ? (
                <p className="m-0 text-sm text-[var(--muted)]">More replays are on their way.</p>
              ) : (
                upNext.map((item) => (
                  <Link
                    key={item.id}
                    href={item.replayUrl ? `/webinars/${item.id}/replay` : "/webinars"}
                    className="replay-upnext-card interactive-card"
                  >
                    <EpisodeThumb webinar={item} className="replay-upnext-thumb" />
                    <div className="min-w-0">
                      <p className="m-0 truncate text-sm font-bold leading-snug">{item.title}</p>
                      <p className="m-0 text-xs text-[var(--muted)]">{formatWebinarDateLabel(item.scheduledAt)}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
