import type { WebinarRecord } from "@/lib/webinars";

/** A highlighted "01", "02"... episode number chip — a quick, unmistakable visual identifier for
 * which episode this is, independent of the title. Pinned top-right on every thumbnail so it
 * never collides with the "Featured" pill some cards already show top-left. */
function EpisodeBadge({ episodeNumber }: { episodeNumber: number }) {
  const padded = String(Math.max(1, episodeNumber || 1)).padStart(2, "0");
  return (
    <span className="episode-badge" aria-label={`Episode ${padded}`}>
      {padded}
    </span>
  );
}

/** Shared thumbnail fallback: a brand-gradient card with the season/episode chip and title when
 * no `thumbnailUrl` is set, otherwise the real image. Extracted from src/app/webinars/page.tsx so
 * both the public webinars page and the dashboard "My webinars" grid render identical cards. */
export function GradientThumb({ webinar, className }: { webinar: WebinarRecord; className?: string }) {
  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden bg-[linear-gradient(150deg,color-mix(in_srgb,var(--brand)_38%,#050b18)_0%,#050b18_70%)] p-6 ${className ?? ""}`}
    >
      <div className="absolute inset-0 opacity-40 [background:radial-gradient(60%_60%_at_20%_10%,rgba(255,255,255,0.16),transparent)]" />
      <EpisodeBadge episodeNumber={webinar.episodeNumber} />
      <span className="relative rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-white/80 backdrop-blur-md">
        {webinar.seasonLabel || "Season 1"} &middot; Ep {webinar.episodeNumber}
      </span>
      <p className="relative m-0 text-lg font-bold leading-snug text-white">{webinar.title}</p>
    </div>
  );
}

export function EpisodeThumb({ webinar, className }: { webinar: WebinarRecord; className?: string }) {
  if (webinar.thumbnailUrl) {
    return (
      <div
        className={`relative bg-cover bg-center ${className ?? ""}`}
        style={{ backgroundImage: `url('${webinar.thumbnailUrl}')` }}
        role="img"
        aria-label={webinar.title}
      >
        <EpisodeBadge episodeNumber={webinar.episodeNumber} />
      </div>
    );
  }
  return <GradientThumb webinar={webinar} className={className} />;
}
