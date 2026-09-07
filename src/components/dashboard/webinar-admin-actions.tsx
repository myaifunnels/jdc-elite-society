"use client";

import { BarChart3, Loader2, Pencil, Star, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";

import {
  deleteWebinarAction,
  setFeaturedWebinarAction,
  type WebinarFormState,
} from "@/app/dashboard/webinars/actions";
import { WebinarFormModal } from "@/components/dashboard/webinar-form-modal";
import type { WebinarRecord } from "@/lib/webinars";
import type { WebinarRegistrant } from "@/lib/webinar-registrants-store";

const initialState: WebinarFormState = {};

const ICON_BTN =
  "inline-flex h-9 w-9 flex-none items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:border-white/30 hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-40";

/** Icon-only edit/delete/feature/stats row shared by the hero card and the "All episodes" grid.
 * The "stats" icon isn't a fake analytics dashboard — there's no view-tracking system in this
 * codebase — it expands the real registrant list (name, tier, status) for this webinar, the same
 * data already backing the avatar row and the pending-overflow queue above. */
export function WebinarAdminActions({
  webinar,
  registrants,
}: {
  webinar: WebinarRecord;
  registrants: WebinarRegistrant[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [featureState, featureAction, featurePending] = useActionState(setFeaturedWebinarAction, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteWebinarAction, initialState);

  const confirmedCount = registrants.filter((item) => item.status === "confirmed").length;
  const pendingOverflowCount = registrants.filter(
    (item) => item.tier === "paid_overflow" && item.status === "pending",
  ).length;

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={ICON_BTN}
          aria-expanded={expanded}
          aria-label={expanded ? "Hide registrant details" : "View registrant details"}
          title="View registrants"
          onClick={() => setExpanded((value) => !value)}
        >
          <BarChart3 size={16} />
        </button>

        <WebinarFormModal
          webinar={webinar}
          trigger={(open) => (
            <button type="button" className={ICON_BTN} aria-label="Edit webinar" title="Edit" onClick={open}>
              <Pencil size={16} />
            </button>
          )}
        />

        {!webinar.isFeatured ? (
          <form action={featureAction}>
            <input type="hidden" name="id" value={webinar.id} />
            <button
              type="submit"
              className={ICON_BTN}
              disabled={featurePending}
              aria-label="Set as featured webinar"
              title="Set as featured"
            >
              {featurePending ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
            </button>
          </form>
        ) : null}

        <form action={deleteAction}>
          <input type="hidden" name="id" value={webinar.id} />
          <button
            type="submit"
            className={`${ICON_BTN} hover:border-red-400/40 hover:bg-red-500/15 hover:text-red-200`}
            disabled={deletePending}
            aria-label="Delete webinar"
            title="Delete"
            onClick={(event) => {
              if (!window.confirm(`Delete "${webinar.title}"?`)) {
                event.preventDefault();
              }
            }}
          >
            {deletePending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          </button>
        </form>
      </div>

      {featureState.error ? <p className="m-0 text-xs font-semibold text-red-300">{featureState.error}</p> : null}
      {deleteState.error ? <p className="m-0 text-xs font-semibold text-red-300">{deleteState.error}</p> : null}

      {expanded ? (
        <div className="rounded-xl border border-white/10 bg-black/25 p-3">
          <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-white/70">
            <span>{confirmedCount} registered</span>
            {pendingOverflowCount > 0 ? (
              <span className="text-amber-300">{pendingOverflowCount} pending review</span>
            ) : null}
          </div>
          {registrants.length === 0 ? (
            <p className="m-0 text-xs text-white/45">No registrants yet.</p>
          ) : (
            <ul className="m-0 grid max-h-40 gap-1.5 overflow-y-auto p-0 text-xs" style={{ listStyle: "none" }}>
              {registrants.map((registrant) => (
                <li key={registrant.id} className="flex items-center justify-between gap-2 text-white/70">
                  <span className="truncate">{registrant.name || registrant.email || "Unnamed"}</span>
                  <span
                    className={`flex-none rounded-full px-2 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-[0.04em] ${
                      registrant.status === "confirmed"
                        ? "bg-emerald-400/15 text-emerald-200"
                        : registrant.status === "pending"
                          ? "bg-amber-400/15 text-amber-200"
                          : "bg-red-400/15 text-red-200"
                    }`}
                  >
                    {registrant.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
