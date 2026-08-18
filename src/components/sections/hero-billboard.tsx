"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { programs } from "@/data/programs";
import { siteContent } from "@/data/site-content";

const HERO_VIDEO_SRC =
  "https://assets.cdn.filesafe.space/Col3j2B7jRDX5y8J5bgN/media/6a7741165a64f2b56797f059.mov";

export function HeroBillboard() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

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
    video.volume = 1;
    video
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  }, []);

  async function playWithSound() {
    const video = videoRef.current;
    if (!video) return;

    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1;
    setMuted(false);

    try {
      await video.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }

  async function pauseVideo() {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setPlaying(false);
  }

  async function onPlayClick() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || muted) {
      await playWithSound();
      return;
    }

    await pauseVideo();
  }

  async function toggleMute() {
    const video = videoRef.current;
    if (!video) return;

    if (muted) {
      await playWithSound();
      return;
    }

    video.muted = true;
    setMuted(true);
  }

  const showPlayIcon = !playing || muted;

  return (
    <section className="hero-netflix">
      <div className="hero-video-wrap">
        <video
          ref={videoRef}
          className="hero-video"
          autoPlay
          muted={muted}
          loop
          playsInline
          preload="auto"
        >
          <source src={HERO_VIDEO_SRC} type='video/mp4; codecs="hvc1"' />
          <source src={HERO_VIDEO_SRC} type="video/mp4" />
          <source src={HERO_VIDEO_SRC} type="video/quicktime" />
        </video>

        <button
          type="button"
          className="hero-play pressable"
          onClick={onPlayClick}
          aria-label={showPlayIcon ? "Play hero video with sound" : "Pause hero video"}
        >
          {showPlayIcon ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5.8v12.4c0 .7.8 1.1 1.4.7l9.2-6.2c.6-.4.6-1.2 0-1.6L9.4 5.1C8.8 4.7 8 5.1 8 5.8Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="6" y="5" width="4.5" height="14" rx="1" />
              <rect x="13.5" y="5" width="4.5" height="14" rx="1" />
            </svg>
          )}
        </button>
      </div>

      <div className="hero-copy container-shell">
        <p className="fade-up hero-kicker">{siteContent.eyebrow}</p>
        <h1 className="fade-up fade-up-delay-1 hero-title">{siteContent.headline}</h1>
        <p className="fade-up fade-up-delay-1 hero-meta">
          <span>Mentorship</span>
          <span>Mindset</span>
          <span>Business</span>
        </p>
        <p className="fade-up fade-up-delay-2 hero-synopsis">{siteContent.subheadline}</p>

        <div className="fade-up fade-up-delay-3 hero-actions">
          <button type="button" className="button-primary pressable hero-cta" onClick={onPlayClick}>
            {showPlayIcon ? "Play with sound" : "Pause video"}
          </button>
          <Link href={siteContent.primaryCta.href} className="button-secondary pressable hero-cta hero-cta-more">
            {siteContent.primaryCta.label}
          </Link>
          <button type="button" className="hero-mute pressable" onClick={toggleMute}>
            {muted ? "Sound off" : "Sound on"}
          </button>
        </div>
      </div>

      <div className="hero-row container-shell">
        <div className="hero-row-head">
          <h2>Featured programs</h2>
          <Link href="/programs">View all</Link>
        </div>
        <div className="hero-row-track">
          {programs.slice(0, 4).map((program) => (
            <Link key={program.slug} href={`/programs/${program.slug}`} className="hero-title-card">
              <p>Program</p>
              <strong>{program.title}</strong>
              <span>{program.shortDescription}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
