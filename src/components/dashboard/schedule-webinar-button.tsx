"use client";

import { Plus } from "lucide-react";

import { WebinarFormModal } from "@/components/dashboard/webinar-form-modal";

/** The "Schedule webinar" trigger for the admin page's DashboardShell actions slot.
 *
 * This has to be its own Client Component: the actions slot is filled from
 * src/app/dashboard/webinars/page.tsx, a Server Component, and WebinarFormModal's `trigger` prop
 * is a function — functions can't be passed from a Server Component to a Client Component across
 * the RSC boundary (only serializable props and React elements can). Rendering this element from
 * the server is fine; the function itself is now defined and consumed entirely on the client. */
export function ScheduleWebinarButton() {
  return (
    <WebinarFormModal
      trigger={(open) => (
        <button
          type="button"
          className="button-primary pressable inline-flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold"
          onClick={open}
        >
          <Plus aria-hidden size={16} />
          Schedule webinar
        </button>
      )}
    />
  );
}
