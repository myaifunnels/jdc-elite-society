"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useSyncExternalStore } from "react";

const MUTE_STORAGE_KEY = "webinar-countdown-muted";

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

function readStoredMuted(): boolean {
  try {
    const stored = window.localStorage.getItem(MUTE_STORAGE_KEY);
    // Default to muted when nothing is stored yet — audible ticking every second is intrusive
    // unless a visitor explicitly opts in.
    if (stored === null) return true;
    return stored !== "false";
  } catch {
    return true;
  }
}

function writeStoredMuted(muted: boolean) {
  try {
    window.localStorage.setItem(MUTE_STORAGE_KEY, String(muted));
  } catch {
    // Private/restricted browser contexts can throw on storage access — ignore, the toggle
    // still works for the rest of the session, it just won't persist.
  }
}

// The mute preference is exposed through useSyncExternalStore (like the tick clock above)
// instead of a useState-in-effect pair — reading localStorage inside an effect and then calling
// setState from it is exactly the react-hooks/set-state-in-effect anti-pattern this file already
// avoids for the clock. getServerSnapshot returns the muted default so the server render and the
// first client render match; React then re-renders with the real stored value right after mount.
let mutedValue: boolean | null = null;
const mutedListeners = new Set<() => void>();

function getMutedSnapshot(): boolean {
  if (mutedValue === null) {
    mutedValue = readStoredMuted();
  }
  return mutedValue;
}

function getServerMutedSnapshot(): boolean {
  return true;
}

function subscribeMuted(callback: () => void) {
  mutedListeners.add(callback);
  return () => {
    mutedListeners.delete(callback);
  };
}

function setMutedPreference(next: boolean) {
  mutedValue = next;
  writeStoredMuted(next);
  mutedListeners.forEach((listener) => listener());
}

/** Plays one short synthesized "tick" via the Web Audio API. Kept intentionally tiny (a ~40ms
 * blip with a fast gain envelope) so it reads as a clock tick, not a beep/click/pop. No audio
 * file asset is used. */
function playTick(context: AudioContext) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = 880;

  const now = context.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.18, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.05);
}

export function WebinarCountdown({ scheduledAt }: { scheduledAt: string }) {
  const target = new Date(scheduledAt).getTime();
  const now = useSyncExternalStore(subscribeTick, getTickSnapshot, getServerTickSnapshot);

  // Defaults to muted (and stays muted on the server render) until the client reads the
  // visitor's stored preference — never autoplay audio without a user gesture.
  const muted = useSyncExternalStore(subscribeMuted, getMutedSnapshot, getServerMutedSnapshot);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastTickedSecondRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      audioContextRef.current?.close().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (muted || now === null) return;
    const second = Math.floor(now / 1000);
    if (lastTickedSecondRef.current === second) return;
    lastTickedSecondRef.current = second;
    const context = audioContextRef.current;
    if (!context || context.state !== "running") return;
    playTick(context);
  }, [muted, now]);

  function toggleMuted() {
    const next = !muted;
    setMutedPreference(next);

    if (!next) {
      // Only create/resume the AudioContext from this direct click handler — that's the user
      // gesture browsers require before allowing audio playback, and it keeps us from ever
      // hitting an autoplay-blocked console error.
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume().catch(() => {});
      }
    }
  }

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
      <button
        type="button"
        onClick={toggleMuted}
        aria-pressed={!muted}
        aria-label={muted ? "Unmute countdown tick sound" : "Mute countdown tick sound"}
        title={muted ? "Unmute countdown tick sound" : "Mute countdown tick sound"}
        className="pressable ml-1 flex h-9 w-9 flex-none items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white/70 backdrop-blur-xl hover:text-white"
      >
        {muted ? <VolumeX aria-hidden size={16} /> : <Volume2 aria-hidden size={16} />}
      </button>
    </div>
  );
}
