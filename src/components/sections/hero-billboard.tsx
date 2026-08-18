"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { programs } from "@/data/programs";
import { siteContent } from "@/data/site-content";

const HERO_VIDEO_SRC =
  "https://assets.cdn.filesafe.space/Col3j2B7jRDX5y8J5bgN/media/6a8425979f720b54ef08fd2f.mp4";

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

    video.defaultMuted = false;
    video.muted = false;
    video.removeAttribute("muted");
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

    if (video.paused || muted || video.muted) {
      await playWithSound();
      return;
    }

    await pauseVideo();
  }

  const showPlayIcon = !playing || muted;

  return (
    <section className="hero-netflix">
      <div className="hero-video-wrap">
        <video
          ref={videoRef}
          className="hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src={HERO_VIDEO_SRC} type="video/mp4" />
        </video>
      </div>

      <button
        type="button"
        className={showPlayIcon ? "hero-play pressable is-waiting" : "hero-play pressable"}
        onClick={onPlayClick}
        aria-label={showPlayIcon ? "Play video" : "Pause video"}
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

      <div className="hero-copy container-shell">
        <p className="fade-up hero-kicker">{siteContent.eyebrow}</p>
        <h1 className="fade-up fade-up-delay-1 hero-title">{siteContent.headline}</h1>
        <p className="fade-up fade-up-delay-1 hero-meta">
          {siteContent.heroTags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </p>
        <p className="fade-up fade-up-delay-2 hero-synopsis">{siteContent.subheadline}</p>

        <div className="fade-up fade-up-delay-3 hero-actions">
          <Link href={siteContent.primaryCta.href} className="button-primary pressable hero-cta">
            {siteContent.primaryCta.label}
          </Link>
          <Link href={siteContent.secondaryCta.href} className="button-secondary pressable hero-cta hero-cta-more">
            {siteContent.secondaryCta.label}
          </Link>
        </div>
      </div>

      <div className="hero-row container-shell">
        <div className="hero-row-head">
          <h2>Featured programs</h2>
          <Link href="/programs">See all programs</Link>
        </div>
        <div className="hero-row-track">
          {programs.slice(0, 4).map((program) => (
            <Link key={program.slug} href={`/programs/${program.slug}`} className="hero-title-card">
              <Image
                src={program.image}
                alt={program.imageAlt}
                fill
                sizes="(max-width: 640px) 82vw, (max-width: 1100px) 40vw, 25vw"
                className="hero-title-card-image"
              />
              <div className="hero-title-card-copy">
                <p>Program</p>
                <strong>{program.title}</strong>
                <span>{program.shortDescription}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
