"use client";

import { useActionState, useState } from "react";

import {
  deleteWebinarAction,
  setFeaturedWebinarAction,
  type WebinarFormState,
} from "@/app/dashboard/webinars/actions";
import { WebinarForm } from "@/components/dashboard/webinar-form";
import type { WebinarRecord } from "@/lib/webinars";

const initialState: WebinarFormState = {};

export function WebinarAdminCard({ webinar }: { webinar: WebinarRecord }) {
  const [editing, setEditing] = useState(false);
  const [featureState, featureAction, featurePending] = useActionState(setFeaturedWebinarAction, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteWebinarAction, initialState);

  const scheduled = new Date(webinar.scheduledAt);
  const scheduledLabel = Number.isNaN(scheduled.getTime())
    ? "No date set"
    : new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(scheduled);

  if (editing) {
    return (
      <article className="sms-template-card">
        <header className="sms-template-card-head">
          <strong>Edit &ldquo;{webinar.title}&rdquo;</strong>
        </header>
        <WebinarForm webinar={webinar} onDone={() => setEditing(false)} />
      </article>
    );
  }

  return (
    <article className="sms-template-card">
      <header className="sms-template-card-head">
        <div>
          <strong>{webinar.title || "Untitled webinar"}</strong>
          <p>
            {webinar.seasonLabel} &middot; Episode {webinar.episodeNumber} &middot; {scheduledLabel}
          </p>
        </div>
        {webinar.isFeatured ? <span className="status-pill is-verified">Featured</span> : null}
      </header>

      {webinar.tagline ? <p className="sms-template-hint">{webinar.tagline}</p> : null}
      <p className="sms-template-vars">
        CTA: {webinar.ctaLabel || "—"} &rarr; {webinar.ctaHref || "—"}
      </p>
      {webinar.interestedCount > 0 ? (
        <p className="sms-template-hint">{webinar.interestedCount} people interested</p>
      ) : null}

      <div className="sms-template-actions">
        <button type="button" className="macos-btn macos-btn-secondary" onClick={() => setEditing(true)}>
          Edit
        </button>

        {!webinar.isFeatured ? (
          <form action={featureAction}>
            <input type="hidden" name="id" value={webinar.id} />
            <button type="submit" className="macos-btn macos-btn-secondary" disabled={featurePending}>
              {featurePending ? "Setting..." : "Set as featured"}
            </button>
          </form>
        ) : null}

        <form action={deleteAction}>
          <input type="hidden" name="id" value={webinar.id} />
          <button
            type="submit"
            className="macos-btn macos-btn-danger"
            disabled={deletePending}
            onClick={(event) => {
              if (!window.confirm(`Delete "${webinar.title}"?`)) {
                event.preventDefault();
              }
            }}
          >
            {deletePending ? "Deleting..." : "Delete"}
          </button>
        </form>
      </div>
      {featureState.error ? <p className="auth-error">{featureState.error}</p> : null}
      {deleteState.error ? <p className="auth-error">{deleteState.error}</p> : null}
    </article>
  );
}
