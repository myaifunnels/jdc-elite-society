"use client";

import { useActionState } from "react";

import { syncWebinarRegistrantsToGhlAction, type WebinarFormState } from "@/app/dashboard/webinars/actions";
import type { WebinarGhlBackfillState } from "@/lib/ghl-webinar-pipeline";

const initialState: WebinarFormState = {};

function formatTime(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/** Admin control for the GoHighLevel webinar pipeline: new registrations sync automatically; this
 * backfills everyone who registered before that existed (and re-syncs anyone, safely — existing
 * opportunity stages are never moved), and shows how the last run went. */
export function WebinarGhlSyncPanel({ state }: { state: WebinarGhlBackfillState }) {
  const [result, action, pending] = useActionState(syncWebinarRegistrantsToGhlAction, initialState);
  const running = state.running || pending;

  return (
    <section className="card-surface grid gap-3 p-5 sm:p-6">
      <div>
        <p className="eyebrow m-0">GoHighLevel</p>
        <h3 className="m-0 mt-1 text-lg font-bold tracking-[-0.02em]">Registrants pipeline</h3>
        <p className="m-0 mt-1 max-w-2xl text-sm text-[var(--muted)]">
          Every new registration is pushed to GoHighLevel automatically as a tagged contact plus an opportunity in your
          webinar pipeline, so you can filter, qualify and nurture them there. Use the button to send everyone who
          registered before now. It&rsquo;s safe to run again &mdash; stages you&rsquo;ve already moved are never
          reset.
        </p>
        <p className="m-0 mt-2 max-w-2xl text-xs text-[var(--muted)]">
          One-time setup in GoHighLevel: create a pipeline named <strong>JDC Webinar Registrants</strong> with stages
          such as <em>Registered</em>, <em>Pending Payment</em>, <em>Attended</em>, <em>Qualified</em> and{" "}
          <em>Nurture</em>. New registrants land in &ldquo;Registered&rdquo; (or the first stage); overflow seats awaiting
          payment review land in the &ldquo;Pending&rdquo; stage.
        </p>
      </div>

      <form action={action} className="flex flex-wrap items-center gap-3">
        <button type="submit" className="macos-btn macos-btn-primary" disabled={running}>
          {running ? "Syncing…" : "Sync all registrants to GoHighLevel"}
        </button>
        {state.total > 0 ? (
          <span className="text-xs font-semibold text-[var(--muted)]">
            {state.running
              ? `Running · ${state.processed} of ${state.total} done`
              : state.finishedAt
                ? `Last sync ${formatTime(state.finishedAt)} · ${state.synced} synced, ${state.failed} failed of ${state.total}`
                : null}
          </span>
        ) : null}
      </form>

      {state.noPipeline ? (
        <p className="auth-error m-0">
          Contacts were pushed and tagged, but no webinar pipeline was found in GoHighLevel, so no opportunities were
          created. Create the &ldquo;JDC Webinar Registrants&rdquo; pipeline, then run the sync again.
        </p>
      ) : null}
      {result.success ? <p className="m-0 text-sm font-semibold text-emerald-300">{result.success}</p> : null}
      {result.error ? <p className="auth-error m-0">{result.error}</p> : null}
    </section>
  );
}
