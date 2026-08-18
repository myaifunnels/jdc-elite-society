"use client";

import { useEffect, useRef, useState } from "react";

const HERO_VIDEO_SRC =
  "https://assets.cdn.filesafe.space/Col3j2B7jRDX5y8J5bgN/media/6a7741165a64f2b56797f059.mov";

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      video.pause();
      setPlaying(false);
      return;
    }

    video.muted = true;
    const playPromise = video.play();
    if (playPromise) {
      playPromise.then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }, []);

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      return;
    }

    video.pause();
    setPlaying(false);
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !muted;
    video.muted = nextMuted;
    setMuted(nextMuted);

    if (!nextMuted && video.paused) {
      video.play().then(() => setPlaying(true)).catch(() => {});
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
        className="hero-play pressable"
        onClick={togglePlayback}
        aria-label={playing ? "Pause hero video" : "Play hero video"}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="6" y="5" width="4.5" height="14" rx="1" />
            <rect x="13.5" y="5" width="4.5" height="14" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5.8v12.4c0 .7.8 1.1 1.4.7l9.2-6.2c.6-.4.6-1.2 0-1.6L9.4 5.1C8.8 4.7 8 5.1 8 5.8Z" />
          </svg>
        )}
      </button>

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
