"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type EliteTestimonial = {
  name: string;
  title: string;
  video?: string;
  driveId?: string;
};

function mediaSrc(item: EliteTestimonial) {
  if (item.video) return item.video;
  if (item.driveId) {
    return `https://drive.usercontent.google.com/download?id=${item.driveId}&export=download&confirm=t`;
  }
  return "";
}

function slotFor(offset: number, total: number) {
  if (offset === 0) return "center";
  if (offset === 1) return "right";
  if (offset === total - 1) return "left";
  return "hidden";
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8.2 5.4c-.7-.4-1.5.1-1.5.9v11.4c0 .8.8 1.3 1.5.9l10.2-5.7c.7-.4.7-1.4 0-1.8L8.2 5.4Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6.2" y="5" width="4" height="14" rx="1.2" />
      <rect x="13.8" y="5" width="4" height="14" rx="1.2" />
    </svg>
  );
}

export function EliteTestimonialsCarousel({ items }: { items: readonly EliteTestimonial[] }) {
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [index, setIndex] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const total = items.length;
  const activeName = items[index]?.name;

  const slides = useMemo(
    () =>
      items.map((item, itemIndex) => {
        const offset = (itemIndex - index + total) % total;
        return { item, slot: slotFor(offset, total) };
      }),
    [index, items, total],
  );

  useEffect(() => {
    if (hoverPaused || soundOn || total < 2) {
      return;
    }
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % total);
    }, 9000);
    return () => window.clearInterval(timer);
  }, [hoverPaused, soundOn, total]);

  useEffect(() => {
    videoRefs.current.forEach((video, name) => {
      const slot = slides.find((slide) => slide.item.name === name)?.slot ?? "hidden";
      const isCenter = slot === "center";
      const isVisible = slot !== "hidden";
      const shouldHear = soundOn && isCenter && name === activeName;

      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.loop = true;
      video.defaultMuted = true;
      video.muted = !shouldHear;
      video.volume = shouldHear ? 1 : 0;

      if (isVisible) {
        const play = video.play();
        if (play) {
          play.catch(() => {
            video.muted = true;
            video.volume = 0;
            if (isCenter) {
              setSoundOn(false);
            }
            void video.play();
          });
        }
      } else {
        video.pause();
        video.muted = true;
        video.volume = 0;
      }
    });
  }, [activeName, slides, soundOn]);

  function go(step: number) {
    setIndex((current) => (current + step + total) % total);
  }

  function toggleCenterAudio() {
    setSoundOn((current) => !current);
  }

  return (
    <div
      className="elite-testimonial-carousel"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
    >
      <div className="elite-testimonial-stage" aria-live="polite">
        {slides.map(({ item, slot }) => {
          const src = mediaSrc(item);
          const isCenter = slot === "center";
          return (
            <figure
              className="elite-glass elite-testimonial-card"
              data-slot={slot}
              data-sound={isCenter && soundOn ? "on" : "off"}
              key={item.name}
              aria-hidden={slot === "hidden"}
            >
              <button
                type="button"
                className="elite-testimonial-hit"
                tabIndex={slot === "hidden" ? -1 : 0}
                aria-label={`Show ${item.name}`}
                onClick={() => {
                  if (slot === "left") go(-1);
                  if (slot === "right") go(1);
                }}
              />
              <div className="elite-testimonial-media">
                {src ? (
                  <video
                    ref={(node) => {
                      if (node) {
                        videoRefs.current.set(item.name, node);
                      } else {
                        videoRefs.current.delete(item.name);
                      }
                    }}
                    src={src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload={slot === "hidden" ? "metadata" : "auto"}
                    controls={false}
                  />
                ) : null}
                {isCenter ? (
                  <button
                    type="button"
                    className="elite-testimonial-play"
                    data-state={soundOn ? "pause" : "play"}
                    onClick={toggleCenterAudio}
                    aria-label={soundOn ? `Mute ${item.name}` : `Play audio for ${item.name}`}
                  >
                    <span className="elite-testimonial-play-pulse" aria-hidden />
                    <span className="elite-testimonial-play-pulse elite-testimonial-play-pulse-delay" aria-hidden />
                    <span className="elite-testimonial-play-core">
                      {soundOn ? <PauseIcon /> : <PlayIcon />}
                    </span>
                  </button>
                ) : (
                  <div className="elite-testimonial-veil" aria-hidden />
                )}
              </div>
              <figcaption>
                <strong>{item.name}</strong>
                <span>{item.title}</span>
              </figcaption>
            </figure>
          );
        })}
      </div>

      <div className="elite-testimonial-nav">
        <button type="button" className="elite-testimonial-arrow" onClick={() => go(-1)} aria-label="Previous testimonial">
          ‹
        </button>
        <div className="elite-testimonial-dots">
          {items.map((item, itemIndex) => (
            <button
              type="button"
              key={item.name}
              className="elite-testimonial-dot"
              data-active={itemIndex === index}
              aria-label={`Show ${item.name}`}
              onClick={() => setIndex(itemIndex)}
            />
          ))}
        </div>
        <button type="button" className="elite-testimonial-arrow" onClick={() => go(1)} aria-label="Next testimonial">
          ›
        </button>
      </div>
    </div>
  );
}
