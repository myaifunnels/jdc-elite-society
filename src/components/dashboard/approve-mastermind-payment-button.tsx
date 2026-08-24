"use client";

import { useActionState } from "react";

import {
  approveMastermindPayment,
  type PaymentActionState,
} from "@/app/dashboard/payments/actions";

const initialState: PaymentActionState = {};

export function ApproveMastermindPaymentButton({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(approveMastermindPayment, initialState);
  return (
    <form action={action} className="payment-approval-form">
      <input type="hidden" name="orderId" value={orderId} />
      <button type="submit" className="macos-btn macos-btn-primary" disabled={pending}>
        {pending ? "Approving..." : "Approve payment"}
      </button>
      {state.error ? <p className="auth-error">{state.error}</p> : null}
      {state.success ? <p className="auth-success">{state.success}</p> : null}
    </form>
  );
}
