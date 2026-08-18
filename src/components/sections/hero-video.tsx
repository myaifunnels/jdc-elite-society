"use client";

import { useEffect, useRef, useState } from "react";

const HERO_VIDEO_SRC =
  "https://assets.cdn.filesafe.space/Col3j2B7jRDX5y8J5bgN/media/6a7741165a64f2b56797f059.mov";

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      video.pause();
      return;
    }

    video.muted = true;
    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => {
        // Autoplay can still fail in some browsers even when muted.
      });
    }
  }, []);

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !muted;
    video.muted = nextMuted;
    setMuted(nextMuted);

    if (!nextMuted) {
      video.play().catch(() => {});
    }
  }

  return (
    <>
      <video
        ref={videoRef}
        className="hero-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source src={HERO_VIDEO_SRC} type='video/mp4; codecs="hvc1"' />
        <source src={HERO_VIDEO_SRC} type="video/mp4" />
        <source src={HERO_VIDEO_SRC} type="video/quicktime" />
      </video>

      <button
        type="button"
        className="hero-mute pressable"
        onClick={toggleMute}
        aria-label={muted ? "Unmute hero video" : "Mute hero video"}
      >
        {muted ? "Unmute" : "Mute"}
      </button>
    </>
  );
}
