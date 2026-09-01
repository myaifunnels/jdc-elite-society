"use client";

import { useActionState } from "react";

import {
  approveMastermindPayment,
  deletePaymentRecord,
  rejectMastermindPayment,
  type PaymentActionState,
} from "@/app/dashboard/payments/actions";

const initialState: PaymentActionState = {};

export function ApproveMastermindPaymentButton({
  orderId,
  compact = false,
}: {
  orderId: string;
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState(approveMastermindPayment, initialState);
  return (
    <form action={action} className="payment-approval-form">
      <input type="hidden" name="orderId" value={orderId} />
      <button type="submit" className="macos-btn macos-btn-primary" disabled={pending}>
        {pending ? "…" : compact ? "Approve" : "Approve payment"}
      </button>
      {state.error ? <p className="auth-error">{state.error}</p> : null}
      {state.success ? <p className="auth-success">{state.success}</p> : null}
    </form>
  );
}

export function RejectMastermindPaymentButton({
  orderId,
  compact = false,
}: {
  orderId: string;
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState(rejectMastermindPayment, initialState);
  return (
    <form
      action={action}
      className="payment-approval-form"
      onSubmit={(event) => {
        if (!window.confirm("Reject this payment? Their University access locks until this is resolved.")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      <button type="submit" className="macos-btn macos-btn-danger" disabled={pending}>
        {pending ? "…" : compact ? "Reject" : "Reject payment"}
      </button>
      {state.error ? <p className="auth-error">{state.error}</p> : null}
      {state.success ? <p className="auth-success">{state.success}</p> : null}
    </form>
  );
}

export function DeletePaymentRecordButton({
  orderId,
  name,
  compact = false,
}: {
  orderId: string;
  name: string;
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState(deletePaymentRecord, initialState);
  return (
    <form
      action={action}
      className="payment-approval-form"
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Delete ${name}? This removes the payment submission, their contact record, and their login. This cannot be undone.`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      <button type="submit" className="macos-btn macos-btn-danger" disabled={pending}>
        {pending ? "…" : compact ? "Delete" : "Delete"}
      </button>
      {state.error ? <p className="auth-error">{state.error}</p> : null}
      {state.success ? <p className="auth-success">{state.success}</p> : null}
    </form>
  );
}
