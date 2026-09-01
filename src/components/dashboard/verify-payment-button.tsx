"use client";

import { useActionState } from "react";

import { AuthFormState, verifyMemberPayment } from "@/app/login/actions";

const initialState: AuthFormState = {};

export function VerifyPaymentButton({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState(verifyMemberPayment, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="userId" value={userId} />
      <button type="submit" className="macos-btn macos-btn-primary" disabled={pending}>
        {pending ? "…" : "Verify"}
      </button>
      {state.error ? <p className="auth-error">{state.error}</p> : null}
    </form>
  );
}
