"use client";

import { useActionState, useEffect } from "react";

import { saveWebinarAction, type WebinarFormState } from "@/app/dashboard/webinars/actions";
import type { WebinarRecord } from "@/lib/webinars";

const initialState: WebinarFormState = {};

const FIELD_LABEL = "text-xs font-bold uppercase tracking-[0.06em] text-white/60";
const FIELD_INPUT =
  "w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/40 focus:bg-black/40";
const SECTION = "grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4";
const SECTION_TITLE = "m-0 text-[0.7rem] font-extrabold uppercase tracking-[0.1em] text-[var(--brand,#57a5ff)]";

const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

/** Shows the stored UTC instant as Asia/Manila time explicitly — not the admin's own browser
 * timezone — since Manila is the timezone every public-facing date/time on this site is
 * displayed in, and toIsoDateTime (src/app/dashboard/webinars/actions.ts) reads this value back
 * as Manila time too. Manila has no DST, so a fixed +8:00 offset is always correct. */
function toDatetimeLocalValue(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const manila = new Date(date.getTime() + MANILA_OFFSET_MS);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${manila.getUTCFullYear()}-${pad(manila.getUTCMonth() + 1)}-${pad(manila.getUTCDate())}T${pad(manila.getUTCHours())}:${pad(manila.getUTCMinutes())}`;
}

/** Dark, modal-friendly styling grouped into clear sections — this form now only ever renders
 * inside WebinarRegisterModal (the "Schedule webinar" trigger for a new episode, or the
 * pencil-icon trigger to edit one). Full create/update/delete/feature CRUD lives across this
 * form plus deleteWebinarAction/setFeaturedWebinarAction in actions.ts. */
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
    <form action={action} className="grid gap-4">
      {webinar ? <input type="hidden" name="id" value={webinar.id} /> : null}

      <div className={SECTION}>
        <p className={SECTION_TITLE}>Basics</p>

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
      </div>

      <div className={SECTION}>
        <p className={SECTION_TITLE}>Schedule &amp; capacity</p>

        <div className="grid gap-1.5">
          <label className={FIELD_LABEL} htmlFor="scheduledAt">
            Date &amp; time (Manila time)
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
        </div>
      </div>

      <div className={SECTION}>
        <p className={SECTION_TITLE}>Media &amp; links</p>

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

        <div className="grid gap-1.5">
          <label className={FIELD_LABEL} htmlFor="zoomLink">
            Zoom join link
          </label>
          <input
            id="zoomLink"
            name="zoomLink"
            defaultValue={webinar?.zoomLink}
            placeholder="https://zoom.us/j/..."
            className={FIELD_INPUT}
          />
          <p className="m-0 text-[0.7rem] text-white/40">
            Shown as &ldquo;Join via Zoom&rdquo; to anyone already registered — on the hero right after
            they sign up, and on their own dashboard. Leave blank until you have the real link.
          </p>
        </div>

        <div className="grid gap-1.5">
          <label className={FIELD_LABEL} htmlFor="replayUrl">
            Replay video link (optional)
          </label>
          <input
            id="replayUrl"
            name="replayUrl"
            defaultValue={webinar?.replayUrl}
            placeholder="https://youtube.com/... or your replay video URL"
            className={FIELD_INPUT}
          />
          <p className="m-0 text-[0.7rem] text-white/40">
            Once the live session is over, drop the replay link here — it shows as &ldquo;Watch
            replay&rdquo; on the public episode card and on a registrant&rsquo;s My Webinars dashboard.
          </p>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold text-white">
        <input type="checkbox" name="isFeatured" defaultChecked={webinar?.isFeatured} />
        Feature this webinar on the public page hero
      </label>

      <div className="grid gap-1">
        <label className="flex items-center gap-2 text-sm font-semibold text-white">
          <input
            type="checkbox"
            name="grantsUniversityAccess"
            defaultChecked={webinar ? webinar.grantsUniversityAccess : true}
          />
          Give registrants University access
        </label>
        <p className="m-0 text-[0.7rem] text-white/40">
          When someone&rsquo;s seat is confirmed, also unlock University/community access for them —
          the same standing as a paid Mastermind buyer. Turn this off for a broad lead-gen webinar
          where you don&rsquo;t want to hand out full community access.
        </p>
      </div>

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
