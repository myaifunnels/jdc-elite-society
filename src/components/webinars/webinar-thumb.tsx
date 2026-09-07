import type { WebinarRecord } from "@/lib/webinars";

/** Shared thumbnail fallback: a brand-gradient card with the season/episode chip and title when
 * no `thumbnailUrl` is set, otherwise the real image. Extracted from src/app/webinars/page.tsx so
 * both the public webinars page and the dashboard "My webinars" grid render identical cards. */
export function GradientThumb({ webinar, className }: { webinar: WebinarRecord; className?: string }) {
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

export function EpisodeThumb({ webinar, className }: { webinar: WebinarRecord; className?: string }) {
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
