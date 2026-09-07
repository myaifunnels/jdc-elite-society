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

    // Next's router.replace is a soft (RSC) transition — it keeps this screen on-screen until
    // the target route's data is ready rather than showing a blank page. If the dashboard's
    // server render is ever unexpectedly slow, that means this card can sit here looking frozen
    // instead of a visible loading state. As a last resort, if the URL still has ?welcome=1 a
    // good while after the soft navigation should have already replaced it, force a full page
    // reload so the user is never stuck here indefinitely.
    const hardFallback = window.setTimeout(() => {
      if (window.location.search.includes("welcome=1")) {
        // Deliberately a hard navigation, not router.replace: this only runs when the soft
        // transition above has already failed to move on, so retrying the same mechanism
        // wouldn't help.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/dashboard");
      }
    }, duration + 8000);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(finish);
      window.clearTimeout(hardFallback);
    };
  }, [welcome, router]);

  if (!open) {
    return null;
  }

  return (
    <div className={leaving ? "macos-boot is-leaving" : "macos-boot"} role="dialog" aria-label="Signing in">
      <div className="macos-boot-wallpaper" aria-hidden />
      <div className="macos-boot-card">
        <ContactAvatar name={name} photoUrl={photoUrl} size="xl" />
        <p className="macos-boot-kicker">Coach JDC</p>
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
