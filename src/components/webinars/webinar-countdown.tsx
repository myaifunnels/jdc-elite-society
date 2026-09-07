"use client";

import { useSyncExternalStore } from "react";

function splitDuration(ms: number) {
  const clamped = Math.max(0, ms);
  const totalSeconds = Math.floor(clamped / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function Tile({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex w-[4.2rem] flex-col items-center gap-1 rounded-2xl border border-white/15 bg-white/[0.06] py-2.5 backdrop-blur-xl sm:w-[4.8rem]">
      <span
        key={value}
        className="fade-up text-[1.5rem] font-extrabold leading-none tracking-[-0.02em] text-white sm:text-[1.8rem]"
        style={{ animationDuration: "260ms" }}
      >
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-white/60">{label}</span>
    </div>
  );
}

// A single module-level ticking clock shared by every mounted countdown, driven through
// useSyncExternalStore so the client clock arrives without ever calling setState from inside
// an effect body (the anti-pattern flagged by react-hooks/set-state-in-effect elsewhere in this
// codebase, e.g. src/components/forms/phone-field.tsx). getServerSnapshot returns null so the
// server render and the first client render both show the placeholder and hydration matches.
let tickValue = Date.now();
const tickListeners = new Set<() => void>();
let tickInterval: ReturnType<typeof setInterval> | null = null;

function subscribeTick(callback: () => void) {
  tickListeners.add(callback);
  if (!tickInterval) {
    tickInterval = setInterval(() => {
      tickValue = Date.now();
      tickListeners.forEach((listener) => listener());
    }, 1000);
  }
  return () => {
    tickListeners.delete(callback);
    if (tickListeners.size === 0 && tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
  };
}

function getTickSnapshot(): number | null {
  return tickValue;
}

function getServerTickSnapshot(): number | null {
  return null;
}

export function WebinarCountdown({ scheduledAt }: { scheduledAt: string }) {
  const target = new Date(scheduledAt).getTime();
  const now = useSyncExternalStore(subscribeTick, getTickSnapshot, getServerTickSnapshot);

  if (now === null || Number.isNaN(target)) {
    // Avoid a hydration mismatch: render nothing until the client clock is available.
    return <div className="h-[4.7rem] sm:h-[5rem]" aria-hidden />;
  }

  const diff = target - now;
  if (diff <= 0) {
    const elapsed = now - target;
    const isRecent = elapsed < 1000 * 60 * 60 * 3; // within 3 hours of start
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-extrabold uppercase tracking-[0.08em] text-white backdrop-blur-xl">
        <i
          aria-hidden
          className="inline-block h-2 w-2 rounded-full bg-[var(--brand)] shadow-[0_0_0_0.3rem_rgba(255,255,255,0.15)]"
        />
        {isRecent ? "Live now" : "Replay available soon"}
      </div>
    );
  }

  const { days, hours, minutes, seconds } = splitDuration(diff);

  return (
    <div className="flex items-center gap-2 sm:gap-2.5" role="timer" aria-live="off">
      <Tile value={days} label="Days" />
      <span className="text-lg font-bold text-white/30">:</span>
      <Tile value={hours} label="Hrs" />
      <span className="text-lg font-bold text-white/30">:</span>
      <Tile value={minutes} label="Min" />
      <span className="text-lg font-bold text-white/30">:</span>
      <Tile value={seconds} label="Sec" />
    </div>
  );
}
