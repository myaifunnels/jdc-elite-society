"use client";

import { useEffect, useMemo, useState } from "react";

export type EliteTestimonial = {
  name: string;
  title: string;
  video?: string;
  driveId?: string;
};

function drivePreviewUrl(id: string) {
  return `https://drive.google.com/file/d/${id}/preview`;
}

function slotFor(offset: number, total: number) {
  if (offset === 0) return "center";
  if (offset === 1) return "right";
  if (offset === total - 1) return "left";
  return "hidden";
}

export function EliteTestimonialsCarousel({ items }: { items: readonly EliteTestimonial[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
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
    }, 5200);
    return () => window.clearInterval(timer);
  }, [paused, total]);

  function go(step: number) {
    setIndex((current) => (current + step + total) % total);
  }

  return (
    <div
      className="elite-testimonial-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="elite-testimonial-stage" aria-live="polite">
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
              {slot === "hidden" ? null : item.driveId ? (
                <iframe
                  title={`${item.name} testimonial`}
                  src={drivePreviewUrl(item.driveId)}
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                />
              ) : (
                <video
                  controls={slot === "center"}
                  playsInline
                  preload={slot === "center" ? "metadata" : "none"}
                  onPlay={() => setPaused(true)}
                  onPause={() => setPaused(false)}
                >
                  <source src={item.video} />
                </video>
              )}
            </div>
            <figcaption>
              <strong>{item.name}</strong>
              <span>{item.title}</span>
            </figcaption>
            {slot !== "center" ? <div className="elite-testimonial-veil" aria-hidden /> : null}
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
