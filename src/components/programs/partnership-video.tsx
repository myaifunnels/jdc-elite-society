"use client";

import { useRef, useState } from "react";

export function PartnershipVideo({ src, autoPlay = false }: { src: string; autoPlay?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(autoPlay);

  function enableSound() {
    const video = ref.current;
    if (!video) return;
    video.muted = false;
    video.currentTime = 0;
    setMuted(false);
    void video.play();
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-black">
      <video
        ref={ref}
        className="aspect-video w-full"
        controls={!muted}
        autoPlay={autoPlay}
        muted={autoPlay}
        loop={autoPlay}
        playsInline
        preload="auto"
      >
        <source src={src} type="video/mp4" />
      </video>
      {muted ? (
        <button
          type="button"
          onClick={enableSound}
          className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-md transition-transform duration-100 active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M11 5 6 9H3v6h3l5 4V5Z" />
            <path d="m16 9 5 6M21 9l-5 6" />
          </svg>
          Enable sound
        </button>
      ) : null}
    </div>
  );
}
