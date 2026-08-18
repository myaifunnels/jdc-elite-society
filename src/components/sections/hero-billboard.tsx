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
  const slotRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const soundOnRef = useRef(false);
  const pipDismissedRef = useRef(false);
  const pipRef = useRef(false);
  const playLockRef = useRef(0);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [pip, setPip] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const slot = slotRef.current;
    const wrap = wrapRef.current;
    if (!video || !slot || !wrap) return;

    document.body.appendChild(wrap);
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");
    video.playsInline = true;
    video.disablePictureInPicture = false;
    video.defaultMuted = true;
    video.muted = !soundOnRef.current;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const tryPlayMuted = () => {
      if (prefersReducedMotion || pipDismissedRef.current) return;
      if (!soundOnRef.current) {
        video.defaultMuted = true;
        video.muted = true;
      }
      const playPromise = video.play();
      if (playPromise) {
        playPromise
          .then(() => setPlaying(!video.paused))
          .catch(() => setPlaying(!video.paused));
      }
    };

    const applyPip = (next: boolean) => {
      pipRef.current = next;
      setPip(next);
      wrap.classList.toggle("is-pip", next);
    };

    const syncDock = () => {
      if (pipDismissedRef.current) {
        wrap.style.display = "none";
        return;
      }

      wrap.style.display = "";

      if (pipRef.current) {
        wrap.style.position = "";
        wrap.style.top = "";
        wrap.style.left = "";
        wrap.style.width = "";
        wrap.style.height = "";
        wrap.style.right = "";
        wrap.style.bottom = "";
        wrap.style.zIndex = "";
        return;
      }

      const rect = slot.getBoundingClientRect();
      wrap.style.position = "fixed";
      wrap.style.top = `${rect.top}px`;
      wrap.style.left = `${rect.left}px`;
      wrap.style.width = `${rect.width}px`;
      wrap.style.height = `${rect.height}px`;
      wrap.style.right = "auto";
      wrap.style.bottom = "auto";
      wrap.style.zIndex = "5";
    };

    const updatePipFromSlot = () => {
      const rect = slot.getBoundingClientRect();
      const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      const ratio = rect.height > 0 ? visibleHeight / rect.height : 0;
      const shouldPip = ratio < 0.42 || rect.bottom < 96;

      if (shouldPip) {
        if (!pipDismissedRef.current && !pipRef.current) {
          applyPip(true);
          tryPlayMuted();
        }
      } else {
        pipDismissedRef.current = false;
        if (pipRef.current) applyPip(false);
        tryPlayMuted();
      }

      syncDock();
    };

    const onPlaying = () => setPlaying(true);
    const onPause = () => {
      if (!video.ended) setPlaying(false);
    };

    if (prefersReducedMotion) {
      video.pause();
    } else {
      tryPlayMuted();
    }

    const onVisibility = () => {
      if (document.visibilityState === "visible") tryPlayMuted();
    };

    video.addEventListener("loadeddata", tryPlayMuted);
    video.addEventListener("canplay", tryPlayMuted);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("scroll", updatePipFromSlot, { passive: true });
    window.addEventListener("resize", updatePipFromSlot);

    let observer: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(updatePipFromSlot, {
        threshold: [0, 0.15, 0.3, 0.45, 0.6, 1],
      });
      observer.observe(slot);
    }

    updatePipFromSlot();

    return () => {
      video.removeEventListener("loadeddata", tryPlayMuted);
      video.removeEventListener("canplay", tryPlayMuted);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", onPause);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", updatePipFromSlot);
      window.removeEventListener("resize", updatePipFromSlot);
      observer?.disconnect();
      slot.appendChild(wrap);
    };
  }, []);

  async function playWithSound() {
    const video = videoRef.current;
    if (!video) return;

    soundOnRef.current = true;
    video.defaultMuted = false;
    video.muted = false;
    video.removeAttribute("muted");
    video.volume = 1;
    setMuted(false);

    try {
      await video.play();
      setPlaying(true);
    } catch {
      try {
        video.muted = true;
        await video.play();
        video.muted = false;
        await video.play();
        setPlaying(true);
      } catch {
        setPlaying(!video.paused);
      }
    }
  }

  async function pauseVideo() {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setPlaying(false);
  }

  async function onPlayClick(event?: React.SyntheticEvent) {
    event?.preventDefault();
    event?.stopPropagation();

    const now = Date.now();
    if (now - playLockRef.current < 350) return;
    playLockRef.current = now;

    const video = videoRef.current;
    if (!video) return;

    if (video.paused || muted || video.muted) {
      await playWithSound();
      return;
    }

    await pauseVideo();
  }

  function closePip() {
    pipDismissedRef.current = true;
    pipRef.current = false;
    setPip(false);
    wrapRef.current?.classList.remove("is-pip");
    if (wrapRef.current) wrapRef.current.style.display = "none";
    void pauseVideo();
  }

  function restoreFromPip() {
    pipDismissedRef.current = false;
    pipRef.current = false;
    setPip(false);
    wrapRef.current?.classList.remove("is-pip");
    slotRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const showPlayIcon = !playing || muted;

  return (
    <section className="hero-netflix">
      <div className="hero-stage" ref={slotRef}>
        <div className={pip ? "hero-video-wrap is-pip" : "hero-video-wrap"} ref={wrapRef}>
          <video
            ref={videoRef}
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            controlsList="nodownload nofullscreen noremoteplayback"
            aria-label="Coach JDC video sales letter"
          >
            <source src={HERO_VIDEO_SRC} type="video/mp4" />
          </video>

          <button
            type="button"
            className={showPlayIcon ? "hero-play pressable is-waiting" : "hero-play pressable"}
            onPointerUp={onPlayClick}
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
            {showPlayIcon && !pip ? <span className="hero-sound-hint">Tap for sound</span> : null}
          </button>

          <button type="button" className="hero-pip-expand" onClick={restoreFromPip} aria-label="Return video to full size">
            Expand
          </button>
          <button type="button" className="hero-pip-close pressable" onClick={closePip} aria-label="Close picture in picture">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 7l10 10M17 7 7 17" />
            </svg>
          </button>
        </div>

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
      </div>

      <div className="hero-row container-shell">
        <div className="hero-row-head">
          <h2>Featured programs</h2>
          <Link href="/programs" className="pressable hero-row-cta">
            See all programs
          </Link>
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
