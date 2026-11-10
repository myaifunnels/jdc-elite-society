"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ContactAvatar } from "@/components/dashboard/contact-avatar";
import { MacosSpinner } from "@/components/dashboard/macos-spinner";

export function MacosBootScreen({
  name,
  photoUrl,
}: {
  name: string;
  photoUrl?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const welcome = searchParams.get("welcome") === "1";
  const [open, setOpen] = useState(welcome);
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const firstName = name.split(" ")[0] || name;

  useEffect(() => {
    if (!welcome) {
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduced ? 200 : 2200;
    const started = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const next = Math.min(100, ((now - started) / duration) * 100);
      setProgress(next);
      if (next < 100) {
        frame = window.requestAnimationFrame(tick);
      }
    };
    frame = window.requestAnimationFrame(tick);

    const finish = window.setTimeout(() => {
      setLeaving(true);
      window.setTimeout(() => {
        setOpen(false);
        router.replace("/dashboard", { scroll: false });
      }, reduced ? 0 : 420);
    }, duration);

    // Last resort: always clear the overlay a few seconds after the animation should have
    // finished, and force a full reload if the URL still carries ?welcome=1 by then (meaning the
    // soft transition above never completed). Unconditional on the "open" side — regardless of
    // *why* the normal path stalls, this guarantees the visitor is never stuck looking at this
    // card indefinitely.
    const hardFallback = window.setTimeout(() => {
      setOpen(false);
      if (window.location.search.includes("welcome=1")) {
        // Deliberately a hard navigation, not router.replace: this only runs when the soft
        // transition above has already failed to move on, so retrying the same mechanism
        // wouldn't help.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/dashboard");
      }
    }, duration + 4000);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(finish);
      window.clearTimeout(hardFallback);
    };
    // Intentionally omits `router` from the dependency list. `progress` updates re-render this
    // component on every animation frame; if that ever made `router` a new reference each
    // render (routers are meant to be stable, but this codebase runs on a Next.js version with
    // documented breaking changes from what any model was trained on — see AGENTS.md), including
    // it here would tear down and restart these timers every frame, so `finish`/`hardFallback`
    // would never survive long enough to fire and this card would sit frozen indefinitely. The
    // effect only needs to run once per "welcome" transition; `router.replace` is called
    // imperatively inside the timeout callbacks below and doesn't need to be reactive here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [welcome]);

  if (!open) {
    return null;
  }

  return (
    <div className={leaving ? "macos-boot is-leaving" : "macos-boot"} role="dialog" aria-label="Signing in">
      <div className="macos-boot-wallpaper" aria-hidden />
      <div className="macos-boot-card">
        <ContactAvatar name={name} photoUrl={photoUrl} size="xl" />
        <h2>Welcome back, {firstName}</h2>
        <p>Opening your workspace</p>
        <div className="macos-boot-track" aria-hidden>
          <span style={{ width: `${progress}%` }} />
        </div>
        <MacosSpinner size={28} />
      </div>
    </div>
  );
}
