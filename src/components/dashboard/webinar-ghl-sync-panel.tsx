"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { syncWebinarRegistrantsToGhlAction, type WebinarFormState } from "@/app/dashboard/webinars/actions";
import type { WebinarGhlBackfillState, WebinarRouting } from "@/lib/ghl-webinar-pipeline";

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

/** Admin control for the AiFunnels webinar pipeline: new registrations sync automatically; this
 * backfills everyone who registered before that existed (and re-syncs anyone, safely — existing
 * opportunity stages are never moved), and shows how the last run went. */
export function WebinarGhlSyncPanel({
  state,
  routing,
}: {
  state: WebinarGhlBackfillState;
  /** Where registrants will land right now, read live from AiFunnels (null = couldn't determine). */
  routing: WebinarRouting | null;
}) {
  const [result, action, pending] = useActionState(syncWebinarRegistrantsToGhlAction, initialState);
  const running = state.running || pending;
  const router = useRouter();

  // The sync runs in the background on the server; re-read its progress every few seconds while it
  // runs so the counts and any error reasons appear without a manual refresh.
  useEffect(() => {
    if (!state.running) return;
    const timer = window.setInterval(() => router.refresh(), 4000);
    return () => window.clearInterval(timer);
  }, [state.running, router]);

  return (
    <section className="card-surface grid gap-3 p-5 sm:p-6">
      <div>
        <p className="eyebrow m-0">AiFunnels</p>
        <h3 className="m-0 mt-1 text-lg font-bold tracking-[-0.02em]">Registrants pipeline</h3>
        <p className="m-0 mt-1 max-w-2xl text-sm text-[var(--muted)]">
          Every new registration is pushed to AiFunnels automatically as a tagged contact plus a lead in the{" "}
          campaign pipeline&rsquo;s <strong>Webinar Registrants</strong> stage, so you can filter, qualify and nurture
          them there. Use the button to send everyone who registered before now. It&rsquo;s safe to run again &mdash;
          stages you&rsquo;ve already moved are never reset.
        </p>
        <p className="m-0 mt-2 max-w-2xl text-xs text-[var(--muted)]">
          The pipeline used is the one with a stage named &ldquo;Registrants&rdquo; (currently B2 Duplication Campaign);
          without one it falls back to the JDC Mastermind pipeline&rsquo;s Leads stage. Someone already in an
          <em> earlier</em> stage, such as <strong>FB Page DMs</strong> from the FREE COACHING comment workflow,
          advances to Webinar Registrants when they register. Nobody is ever moved backward.
        </p>
        <p className="m-0 mt-2 max-w-2xl text-xs text-[var(--muted)]">
          Each registrant is also tagged <strong>Webinar source: FREE COACHING comment</strong> (they commented first,
          matched by your workflow&rsquo;s <em>passive-income-webinar-registrant</em> tag or their FB Page DMs card) or{" "}
          <strong>Webinar source: direct</strong>, so you can filter either group in AiFunnels. People are matched by
          the email or phone they registered with.
        </p>
        <p className="m-0 mt-2 max-w-2xl text-xs text-[var(--muted)]">
          Anyone already in that pipeline (a Mastermind buyer or an existing lead) keeps their card untouched &mdash;
          no duplicates. Registrant leads show the source &ldquo;Webinar &middot; &lt;title&gt;&rdquo;, and every
          registrant is tagged with the webinar, seat type and status, so you can filter by any of them in AiFunnels.
        </p>
      </div>

      {routing ? (
        <div className="rounded-xl border border-[var(--line)] p-3 text-sm">
          <span className="text-[var(--muted)]">Registrants are routed to: </span>
          <strong>{routing.pipelineName}</strong>
          <span className="text-[var(--muted)]"> &rarr; </span>
          <strong>{routing.stageName}</strong>
          {routing.otherCandidates.length > 0 ? (
            <p className="m-0 mt-1 text-xs text-amber-300">
              Heads up: {routing.otherCandidates.join(", ")} also {routing.otherCandidates.length === 1 ? "has" : "have"} a
              Registrants stage and is being ignored. Rename or remove that stage if it shouldn&rsquo;t compete.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="m-0 rounded-xl border border-[var(--line)] p-3 text-sm text-[var(--muted)]">
          Couldn&rsquo;t read your AiFunnels pipelines just now, so the destination can&rsquo;t be shown. Check that the
          API key and location ID are set in Integrations.
        </p>
      )}

      <form action={action} className="flex flex-wrap items-center gap-3">
        <button type="submit" className="macos-btn macos-btn-primary" disabled={running}>
          {running ? "Syncing…" : "Sync all registrants to AiFunnels"}
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

      {state.processed > 0 ? (
        <p className="m-0 text-xs text-[var(--muted)]">
          So far: <strong>{state.created}</strong> new cards created &middot; <strong>{state.advanced}</strong> moved up
          from an earlier stage &middot; <strong>{state.resynced}</strong> already had their webinar card and were just
          confirmed (normal on a repeat sync) &middot; <strong>{state.alreadyInPipeline}</strong> already had a{" "}
          <em>different</em> card further along and were left untouched (e.g. existing Mastermind buyers) &middot;{" "}
          <strong>{state.failed}</strong> failed
        </p>
      ) : null}
      {!state.running && state.finishedAt && (state.fromComment > 0 || state.direct > 0) ? (
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--line)] p-3">
            <p className="m-0 text-2xl font-extrabold">{state.fromComment}</p>
            <p className="m-0 text-xs text-[var(--muted)]">Registered after commenting FREE COACHING</p>
          </div>
          <div className="rounded-xl border border-[var(--line)] p-3">
            <p className="m-0 text-2xl font-extrabold">{state.direct}</p>
            <p className="m-0 text-xs text-[var(--muted)]">Registered directly (no comment)</p>
          </div>
          <div className="rounded-xl border border-[var(--line)] p-3">
            <p className="m-0 text-2xl font-extrabold">
              {state.stillBeforeRegistrants === null ? "—" : state.stillBeforeRegistrants}
            </p>
            <p className="m-0 text-xs text-[var(--muted)]">Still before Webinar Registrants (commented, not registered)</p>
          </div>
        </div>
      ) : null}
      {state.noPipeline ? (
        <p className="auth-error m-0">
          Contacts were pushed and tagged, but no pipeline with a &ldquo;Registrants&rdquo; stage (or a JDC Mastermind
          pipeline) was found in AiFunnels, so no cards were created. Check the stage name, and that the API key can
          read Opportunities, then run the sync again.
        </p>
      ) : null}
      {state.errorSamples.length > 0 ? (
        <div className="auth-error m-0 grid gap-1">
          <strong>{state.failed} registrant(s) couldn&rsquo;t be synced. Reasons AiFunnels gave:</strong>
          {state.errorSamples.map((message) => (
            <span key={message} className="text-xs">
              &bull; {message}
            </span>
          ))}
        </div>
      ) : null}
      {result.success ? <p className="m-0 text-sm font-semibold text-emerald-300">{result.success}</p> : null}
      {result.error ? <p className="auth-error m-0">{result.error}</p> : null}
    </section>
  );
}
