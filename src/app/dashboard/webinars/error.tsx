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
        {/* This is an admin-only internal page, so it's worth showing the raw error here
            temporarily to debug the current production issue without needing server log access —
            remove this block once the underlying bug is confirmed fixed. */}
        <div className="mt-3 rounded-lg border border-[var(--line)] bg-black/20 p-3 text-left">
          <p className="m-0 break-words font-mono text-xs text-red-300">{error.message || "No error message."}</p>
          {error.digest ? (
            <p className="mt-1 m-0 text-xs text-[var(--muted)]">Digest: {error.digest}</p>
          ) : null}
          {error.stack ? (
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words text-[0.65rem] text-[var(--muted)]">
              {error.stack}
            </pre>
          ) : null}
        </div>
        <button type="button" className="button-primary pressable mt-4 inline-flex" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
