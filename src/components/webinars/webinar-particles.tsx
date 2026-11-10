"use client";

import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 40;

type Particle = {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  speedY: number;
  opacity: number;
};

function makeParticles(width: number, height: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 0.6 + Math.random() * 1.6,
      speedX: (Math.random() - 0.5) * 0.12,
      speedY: -0.05 - Math.random() * 0.12,
      opacity: 0.12 + Math.random() * 0.22,
    });
  }
  return particles;
}

/** Subtle "dust in a spotlight" cinematic effect layered behind the hero copy — small, low-opacity,
 * slowly drifting brand-blue specks. Purely decorative: paused off-screen and off-tab, and reduced
 * to a single static frame under prefers-reduced-motion. Not a distraction, so keep the particle
 * count and speed low if you touch this file. */
export function WebinarParticles({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let frameId = 0;

    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function resize() {
      if (!canvas) return;
      const rect = canvas.parentElement?.getBoundingClientRect();
      width = rect?.width ?? window.innerWidth;
      height = rect?.height ?? window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = makeParticles(width, height);
    }

    function drawFrame() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      for (const particle of particles) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(120, 170, 255, ${particle.opacity})`;
        ctx.fill();
      }
    }

    function step() {
      if (!ctx) return;
      for (const particle of particles) {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        if (particle.y < -4) particle.y = height + 4;
        if (particle.x < -4) particle.x = width + 4;
        if (particle.x > width + 4) particle.x = -4;
      }
      drawFrame();
      frameId = window.requestAnimationFrame(step);
    }

    function start() {
      if (frameId) return;
      if (reduceMotionQuery.matches) {
        drawFrame();
        return;
      }
      if (document.visibilityState !== "visible") return;
      frameId = window.requestAnimationFrame(step);
    }

    function stop() {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        start();
      } else {
        stop();
      }
    }

    resize();
    drawFrame();
    start();

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stop();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className ?? ""}`}
    />
  );
}
