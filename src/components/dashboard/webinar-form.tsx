"use client";

import { useActionState, useEffect } from "react";

import { saveWebinarAction, type WebinarFormState } from "@/app/dashboard/webinars/actions";
import type { WebinarRecord } from "@/lib/webinars";

const initialState: WebinarFormState = {};

function toDatetimeLocalValue(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function WebinarForm({
  webinar,
  onDone,
}: {
  webinar?: WebinarRecord;
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState(saveWebinarAction, initialState);

  useEffect(() => {
    if (state.success && onDone) {
      onDone();
    }
  }, [state.success, onDone]);

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {webinar ? <input type="hidden" name="id" value={webinar.id} /> : null}

      <div className="grid gap-1.5 sm:col-span-2">
        <label className="sms-template-label" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          name="title"
          defaultValue={webinar?.title}
          placeholder="e.g. How to Build Passive Income in Network Marketing"
          className="sms-template-input"
          required
        />
      </div>

      <div className="grid gap-1.5">
        <label className="sms-template-label" htmlFor="seasonLabel">
          Season label
        </label>
        <input
          id="seasonLabel"
          name="seasonLabel"
          defaultValue={webinar?.seasonLabel ?? "Season 1"}
          placeholder="Season 1"
          className="sms-template-input"
        />
      </div>

      <div className="grid gap-1.5">
        <label className="sms-template-label" htmlFor="episodeNumber">
          Episode number
        </label>
        <input
          id="episodeNumber"
          name="episodeNumber"
          type="number"
          min={1}
          defaultValue={webinar?.episodeNumber ?? 1}
          className="sms-template-input"
        />
      </div>

      <div className="grid gap-1.5 sm:col-span-2">
        <label className="sms-template-label" htmlFor="tagline">
          Tagline (bold one-line hook)
        </label>
        <input
          id="tagline"
          name="tagline"
          defaultValue={webinar?.tagline}
          placeholder="Build income that keeps working after you stop."
          className="sms-template-input"
        />
      </div>

      <div className="grid gap-1.5 sm:col-span-2">
        <label className="sms-template-label" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={webinar?.description}
          rows={3}
          className="sms-template-textarea"
          placeholder="A supporting sentence about what this session covers."
        />
      </div>

      <div className="grid gap-1.5">
        <label className="sms-template-label" htmlFor="hostName">
          Host name
        </label>
        <input
          id="hostName"
          name="hostName"
          defaultValue={webinar?.hostName ?? "Coach JDC"}
          className="sms-template-input"
        />
      </div>

      <div className="grid gap-1.5">
        <label className="sms-template-label" htmlFor="hostTitle">
          Host title
        </label>
        <input
          id="hostTitle"
          name="hostTitle"
          defaultValue={webinar?.hostTitle ?? "Founder, JDC Elite Society"}
          className="sms-template-input"
        />
      </div>

      <div className="grid gap-1.5">
        <label className="sms-template-label" htmlFor="scheduledAt">
          Date &amp; time
        </label>
        <input
          id="scheduledAt"
          name="scheduledAt"
          type="datetime-local"
          defaultValue={toDatetimeLocalValue(webinar?.scheduledAt ?? "")}
          className="sms-template-input"
          required
        />
      </div>

      <div className="grid gap-1.5">
        <label className="sms-template-label" htmlFor="interestedCount">
          People interested
        </label>
        <input
          id="interestedCount"
          name="interestedCount"
          type="number"
          min={0}
          defaultValue={webinar?.interestedCount ?? 0}
          className="sms-template-input"
        />
        <p className="sms-template-hint">Shown as &ldquo;N people interested&rdquo;. Leave 0 to hide it.</p>
      </div>

      <div className="grid gap-1.5 sm:col-span-2">
        <label className="sms-template-label" htmlFor="thumbnailUrl">
          Thumbnail image URL (optional)
        </label>
        <input
          id="thumbnailUrl"
          name="thumbnailUrl"
          defaultValue={webinar?.thumbnailUrl}
          placeholder="https://..."
          className="sms-template-input"
        />
        <p className="sms-template-hint">Leave blank to show a gradient card with the episode number and title.</p>
      </div>

      <div className="grid gap-1.5">
        <label className="sms-template-label" htmlFor="ctaLabel">
          CTA button label
        </label>
        <input
          id="ctaLabel"
          name="ctaLabel"
          defaultValue={webinar?.ctaLabel ?? "Reserve your free seat"}
          className="sms-template-input"
          required
        />
      </div>

      <div className="grid gap-1.5">
        <label className="sms-template-label" htmlFor="ctaHref">
          CTA button link
        </label>
        <input
          id="ctaHref"
          name="ctaHref"
          defaultValue={webinar?.ctaHref}
          placeholder="/passive-income or https://zoom.us/..."
          className="sms-template-input"
          required
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
        <input type="checkbox" name="isFeatured" defaultChecked={webinar?.isFeatured} />
        Feature this webinar on the public page hero
      </label>

      <div className="sms-template-actions sm:col-span-2">
        <button type="submit" className="macos-btn macos-btn-primary" disabled={pending}>
          {pending ? "Saving..." : webinar ? "Save changes" : "Add webinar"}
        </button>
        {onDone ? (
          <button type="button" className="macos-btn macos-btn-secondary" onClick={onDone}>
            Cancel
          </button>
        ) : null}
      </div>
      {state.error ? <p className="auth-error sm:col-span-2">{state.error}</p> : null}
      {state.success ? <p className="auth-success sm:col-span-2">{state.success}</p> : null}
    </form>
  );
}
