"use client";

import { useActionState } from "react";

import { ContactTagState, toggleContactAffiliateTag } from "@/app/dashboard/contacts/actions";
import { parseAffiliatePrograms } from "@/lib/affiliate";

const initial: ContactTagState = {};

export function ContactAffiliateTags({
  contactId,
  tags,
}: {
  contactId: string;
  tags: string[];
}) {
  const programs = parseAffiliatePrograms(tags);
  const [state, action, pending] = useActionState(toggleContactAffiliateTag, initial);

  return (
    <div className="grid gap-3">
      <p className="macos-lead" style={{ textAlign: "left" }}>
        Pioneer unlocks the Foundation Course campaign. jdc-partner is coach-only and adds a second 20% campaign for
        Mastermind Sessions 1 and 2, with its own link and QR.
      </p>
      {(
        [
          ["pioneer", "Pioneer", programs.includes("pioneer")],
          ["jdc-partner", "jdc-partner", programs.includes("jdc-partner")],
        ] as const
      ).map(([tag, label, enabled]) => (
        <form key={tag} action={action} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="contactId" value={contactId} />
          <input type="hidden" name="tag" value={tag} />
          <input type="hidden" name="enabled" value={enabled ? "" : "on"} />
          <span className="dashboard-chip">{label}</span>
          <button type="submit" disabled={pending} className="macos-btn macos-btn-secondary pressable disabled:opacity-70">
            {enabled ? "Remove" : "Add"}
          </button>
        </form>
      ))}
      {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400">{state.success}</p> : null}
    </div>
  );
}
