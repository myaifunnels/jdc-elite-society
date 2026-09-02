"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type EliteTestimonial = {
  name: string;
  title: string;
  video?: string;
  driveId?: string;
};

function mediaSrc(item: EliteTestimonial) {
  if (item.driveId) {
    return `https://drive.usercontent.google.com/download?id=${item.driveId}&export=download&confirm=t`;
  }
  return item.video ?? "";
}

function slotFor(offset: number, total: number) {
  if (offset === 0) return "center";
  if (offset === 1) return "right";
  if (offset === total - 1) return "left";
  return "hidden";
}

export function EliteTestimonialsCarousel({ items }: { items: readonly EliteTestimonial[] }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const total = items.length;

  const slides = useMemo(
    () =>
      items.map((item, itemIndex) => {
        const offset = (itemIndex - index + total) % total;
        return { item, slot: slotFor(offset, total) };
      }),
    [index, items, total],
  );

  useEffect(() => {
    if (paused || total < 2) {
      return;
    }
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % total);
    }, 12000);
    return () => window.clearInterval(timer);
  }, [paused, total]);

  useEffect(() => {
    const videos = stageRef.current?.querySelectorAll("video") ?? [];
    videos.forEach((video) => {
      video.muted = muted;
      video.defaultMuted = muted;
      video.playsInline = true;
      const play = video.play();
      if (play) {
        play.catch(() => {
          video.muted = true;
          void video.play();
        });
      }
    });
  }, [index, muted]);

  function go(step: number) {
    setIndex((current) => (current + step + total) % total);
  }

  return (
    <div
      className="elite-testimonial-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="elite-testimonial-stage" aria-live="polite" ref={stageRef}>
        {slides.map(({ item, slot }) => (
          <figure
            className="elite-glass elite-testimonial-card"
            data-slot={slot}
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
              {slot === "hidden" ? null : (
                <video autoPlay muted loop playsInline preload="auto">
                  <source src={mediaSrc(item)} />
                </video>
              )}
            </div>
            <figcaption>
              <strong>{item.name}</strong>
              <span>{item.title}</span>
            </figcaption>
            {slot === "center" ? (
              <button
                type="button"
                className="elite-testimonial-sound"
                onClick={() => setMuted((current) => !current)}
                aria-label={muted ? "Unmute testimonials" : "Mute testimonials"}
              >
                {muted ? "Sound on" : "Mute"}
              </button>
            ) : (
              <div className="elite-testimonial-veil" aria-hidden />
            )}
          </figure>
        ))}
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
