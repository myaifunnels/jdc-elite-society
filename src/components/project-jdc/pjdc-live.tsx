"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { cn } from "@/lib/utils";

const REFRESH_MS = 20_000;

/**
 * Keeps a dashboard live for admins, facilitators and students: it quietly re-reads the
 * server data every 20 seconds while the tab is visible, and again when the person comes back
 * to the tab or the phone regains a connection. Tap it to refresh right now.
 */
export function PjdcLive() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [updatedAt, setUpdatedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [offline, setOffline] = useState(false);
  const lastRun = useRef(0);

  const refresh = useCallback(() => {
    if (Date.now() - lastRun.current < 4_000) return;
    lastRun.current = Date.now();
    startTransition(() => {
      router.refresh();
      setUpdatedAt(Date.now());
    });
  }, [router]);

  useEffect(() => {
    const poll = setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) refresh();
    }, REFRESH_MS);
    const tick = setInterval(() => setNow(Date.now()), 5_000);
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - updatedAt > 8_000) refresh();
    };
    const onOnline = () => {
      setOffline(false);
      refresh();
    };
    const onOffline = () => setOffline(true);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [refresh, updatedAt]);

  const seconds = Math.max(0, Math.round((now - updatedAt) / 1000));
  const label = offline ? "Offline" : pending ? "Updating…" : seconds < 10 ? "Live" : seconds < 60 ? `${seconds}s ago` : `${Math.round(seconds / 60)}m ago`;

  return (
    <button
      type="button"
      className={cn("pjdc-live", offline && "is-offline", pending && "is-busy")}
      onClick={() => {
        lastRun.current = 0;
        refresh();
      }}
      aria-label={`Refresh now. ${label}`}
    >
      <span className="pjdc-live-dot" aria-hidden />
      <span>{label}</span>
      <RefreshCw aria-hidden size={13} />
    </button>
  );
}
