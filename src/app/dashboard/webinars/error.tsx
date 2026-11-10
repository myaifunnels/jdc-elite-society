"use client";

import { useEffect } from "react";

export default function WebinarsAdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Webinars admin page failed to render", error);
  }, [error]);

  return (
    <div className="dashboard-content">
      <div className="card-surface mx-auto mt-10 max-w-lg p-8 text-center">
        <p className="m-0 text-lg font-extrabold text-[var(--heading)]">Webinars couldn&rsquo;t load</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Something went wrong loading the webinar library. This is usually temporary — try again.
        </p>
        {error.digest ? (
          <p className="mt-2 text-xs text-[var(--muted)]">Reference: {error.digest}</p>
        ) : null}
        <button type="button" className="button-primary pressable mt-4 inline-flex" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
