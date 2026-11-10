"use client";

import { useActionState } from "react";

import {
  approveOverflowRegistrantAction,
  rejectOverflowRegistrantAction,
  type WebinarFormState,
} from "@/app/dashboard/webinars/actions";
import { mediaSrc, isDisplayableImageSrc } from "@/lib/media";
import type { WebinarRegistrant } from "@/lib/webinar-registrants-store";

const initialState: WebinarFormState = {};

export function WebinarOverflowCard({
  registrant,
  webinarTitle,
}: {
  registrant: WebinarRegistrant;
  webinarTitle: string;
}) {
  const [approveState, approveAction, approvePending] = useActionState(approveOverflowRegistrantAction, initialState);
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectOverflowRegistrantAction, initialState);

  const receiptSrc = mediaSrc(registrant.paymentReceiptUrl);
  const receiptIsImage = isDisplayableImageSrc(registrant.paymentReceiptUrl);

  return (
    <article className="sms-template-card">
      <header className="sms-template-card-head">
        <div>
          <strong>{registrant.name}</strong>
          <p>
            {registrant.email} &middot; {registrant.phone}
          </p>
        </div>
        <span className="status-pill">Pending &middot; ₱{registrant.amountPaid}</span>
      </header>

      <p className="sms-template-hint">Webinar: {webinarTitle}</p>

      {receiptSrc ? (
        receiptIsImage ? (
          <a href={receiptSrc} target="_blank" rel="noreferrer" className="mt-2 block max-w-[220px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={receiptSrc}
              alt={`Payment receipt from ${registrant.name}`}
              className="w-full rounded-lg border border-[var(--line)] object-cover"
            />
          </a>
        ) : (
          <a href={receiptSrc} target="_blank" rel="noreferrer" className="macos-btn macos-btn-secondary mt-2 inline-flex w-fit">
            View receipt
          </a>
        )
      ) : (
        <p className="sms-template-hint">No receipt on file.</p>
      )}

      <div className="sms-template-actions">
        <form action={approveAction}>
          <input type="hidden" name="id" value={registrant.id} />
          <button type="submit" className="macos-btn macos-btn-primary" disabled={approvePending || rejectPending}>
            {approvePending ? "Approving..." : "Approve"}
          </button>
        </form>
        <form action={rejectAction}>
          <input type="hidden" name="id" value={registrant.id} />
          <button
            type="submit"
            className="macos-btn macos-btn-danger"
            disabled={approvePending || rejectPending}
            onClick={(event) => {
              if (!window.confirm(`Reject ${registrant.name}'s overflow seat?`)) {
                event.preventDefault();
              }
            }}
          >
            {rejectPending ? "Rejecting..." : "Reject"}
          </button>
        </form>
      </div>
      {approveState.error ? <p className="auth-error">{approveState.error}</p> : null}
      {rejectState.error ? <p className="auth-error">{rejectState.error}</p> : null}
    </article>
  );
}
