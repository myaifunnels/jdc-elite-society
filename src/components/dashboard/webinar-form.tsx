"use client";

import { useActionState, useEffect } from "react";

import { saveWebinarAction, type WebinarFormState } from "@/app/dashboard/webinars/actions";
import type { WebinarRecord } from "@/lib/webinars";

const initialState: WebinarFormState = {};

const FIELD_LABEL = "text-xs font-bold uppercase tracking-[0.06em] text-white/60";
const FIELD_INPUT =
  "w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/40";

function toDatetimeLocalValue(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Dark, modal-friendly styling — this form now only ever renders inside WebinarRegisterModal
 * (the "Schedule webinar" trigger for a new episode, or the pencil-icon trigger to edit one). */
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
    <form action={action} className="grid gap-3">
      {webinar ? <input type="hidden" name="id" value={webinar.id} /> : null}

      <div className="grid gap-1.5">
        <label className={FIELD_LABEL} htmlFor="title">
          Title
        </label>
        <input
          id="title"
          name="title"
          defaultValue={webinar?.title}
          placeholder="e.g. How to Build Passive Income in Network Marketing"
          className={FIELD_INPUT}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <label className={FIELD_LABEL} htmlFor="seasonLabel">
            Season label
          </label>
          <input
            id="seasonLabel"
            name="seasonLabel"
            defaultValue={webinar?.seasonLabel ?? "Season 1"}
            placeholder="Season 1"
            className={FIELD_INPUT}
          />
        </div>

        <div className="grid gap-1.5">
          <label className={FIELD_LABEL} htmlFor="episodeNumber">
            Episode number
          </label>
          <input
            id="episodeNumber"
            name="episodeNumber"
            type="number"
            min={1}
            defaultValue={webinar?.episodeNumber ?? 1}
            className={FIELD_INPUT}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <label className={FIELD_LABEL} htmlFor="tagline">
          Tagline (bold one-line hook)
        </label>
        <input
          id="tagline"
          name="tagline"
          defaultValue={webinar?.tagline}
          placeholder="Build income that keeps working after you stop."
          className={FIELD_INPUT}
        />
      </div>

      <div className="grid gap-1.5">
        <label className={FIELD_LABEL} htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={webinar?.description}
          rows={3}
          className={`${FIELD_INPUT} resize-y`}
          placeholder="A supporting sentence about what this session covers."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <label className={FIELD_LABEL} htmlFor="hostName">
            Host name
          </label>
          <input
            id="hostName"
            name="hostName"
            defaultValue={webinar?.hostName ?? "Coach JDC"}
            className={FIELD_INPUT}
          />
        </div>

        <div className="grid gap-1.5">
          <label className={FIELD_LABEL} htmlFor="hostTitle">
            Host title
          </label>
          <input
            id="hostTitle"
            name="hostTitle"
            defaultValue={webinar?.hostTitle ?? "Founder, JDC Elite Society"}
            className={FIELD_INPUT}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <label className={FIELD_LABEL} htmlFor="scheduledAt">
          Date &amp; time (your local time)
        </label>
        <input
          id="scheduledAt"
          name="scheduledAt"
          type="datetime-local"
          defaultValue={toDatetimeLocalValue(webinar?.scheduledAt ?? "")}
          className={FIELD_INPUT}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <label className={FIELD_LABEL} htmlFor="interestedCount">
            People interested
          </label>
          <input
            id="interestedCount"
            name="interestedCount"
            type="number"
            min={0}
            defaultValue={webinar?.interestedCount ?? 0}
            className={FIELD_INPUT}
          />
          <p className="m-0 text-[0.7rem] text-white/40">Shown as &ldquo;N people interested&rdquo;. 0 hides it.</p>
        </div>

        <div className="grid gap-1.5">
          <label className={FIELD_LABEL} htmlFor="totalSeats">
            Total free seats
          </label>
          <input
            id="totalSeats"
            name="totalSeats"
            type="number"
            min={0}
            defaultValue={webinar?.totalSeats ?? 100}
            className={FIELD_INPUT}
          />
          <p className="m-0 text-[0.7rem] text-white/40">New signups switch to paid overflow past this number.</p>
        </div>
      </div>

      <div className="grid gap-1.5">
        <label className={FIELD_LABEL} htmlFor="thumbnailUrl">
          Thumbnail image URL (optional)
        </label>
        <input
          id="thumbnailUrl"
          name="thumbnailUrl"
          defaultValue={webinar?.thumbnailUrl}
          placeholder="https://..."
          className={FIELD_INPUT}
        />
        <p className="m-0 text-[0.7rem] text-white/40">Leave blank for a gradient card with the episode number and title.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <label className={FIELD_LABEL} htmlFor="ctaLabel">
            CTA button label
          </label>
          <input
            id="ctaLabel"
            name="ctaLabel"
            defaultValue={webinar?.ctaLabel ?? "Reserve your free seat"}
            className={FIELD_INPUT}
            required
          />
        </div>

        <div className="grid gap-1.5">
          <label className={FIELD_LABEL} htmlFor="ctaHref">
            CTA button link
          </label>
          <input
            id="ctaHref"
            name="ctaHref"
            defaultValue={webinar?.ctaHref}
            placeholder="/passive-income or https://zoom.us/..."
            className={FIELD_INPUT}
            required
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold text-white">
        <input type="checkbox" name="isFeatured" defaultChecked={webinar?.isFeatured} />
        Feature this webinar on the public page hero
      </label>

      <div className="mt-1 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="button-primary pressable inline-flex min-h-[2.85rem] items-center justify-center px-5 text-sm font-extrabold disabled:opacity-60"
        >
          {pending ? "Saving..." : webinar ? "Save changes" : "Add webinar"}
        </button>
        {onDone ? (
          <button
            type="button"
            className="button-secondary pressable inline-flex min-h-[2.85rem] items-center justify-center px-5 text-sm font-bold"
            onClick={onDone}
          >
            Cancel
          </button>
        ) : null}
      </div>
      {state.error ? <p className="m-0 text-sm font-semibold text-red-300">{state.error}</p> : null}
      {state.success ? <p className="m-0 text-sm font-semibold text-emerald-300">{state.success}</p> : null}
    </form>
  );
}
