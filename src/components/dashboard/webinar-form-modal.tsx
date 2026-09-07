"use client";

import { useState } from "react";

import { WebinarForm } from "@/components/dashboard/webinar-form";
import { WebinarRegisterModal } from "@/components/webinars/webinar-register-modal";
import type { WebinarRecord } from "@/lib/webinars";

/** Shared add/edit surface for the admin library: opens WebinarForm inside the same accessible
 * modal built for the public registration flow (WebinarRegisterModal), instead of the old
 * always-visible MacosWindow panel / inline edit-in-place card. Pass `webinar` to edit an
 * existing episode, or omit it to schedule a new one. `trigger` renders whatever control should
 * open the modal (a full "+ Schedule webinar" button, or an icon-only pencil button). */
export function WebinarFormModal({
  webinar,
  trigger,
}: {
  webinar?: WebinarRecord;
  trigger: (open: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {trigger(() => setOpen(true))}
      <WebinarRegisterModal
        open={open}
        onClose={() => setOpen(false)}
        title={webinar ? `Edit "${webinar.title || "webinar"}"` : "Schedule a webinar"}
        size="lg"
      >
        <WebinarForm webinar={webinar} onDone={() => setOpen(false)} />
      </WebinarRegisterModal>
    </>
  );
}
