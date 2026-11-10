"use client";

import { useActionState } from "react";

import { AuthFormState } from "@/app/login/actions";
import { approveAllMemberRegistrationsAction } from "@/app/dashboard/registrations/actions";

const initialState: AuthFormState = {};

export function ApproveAllRegistrationsForm({ pendingCount }: { pendingCount: number }) {
  const [state, formAction, pending] = useActionState(approveAllMemberRegistrationsAction, initialState);

  return (
    <form action={formAction} className="grid gap-3">
      <p className="macos-lead" style={{ textAlign: "left" }}>
        Marks registration and payment verified for every pending member and contact. Completing that admin
        sign-off verifies accounts that already finished their profile. Admin and partner seats are not included.
      </p>
      <p className="text-sm">Pending payment checks: {pendingCount}.</p>
      {state.error ? <p className="auth-error">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400">{state.success}</p> : null}
      <button
        type="submit"
        className="macos-btn macos-btn-primary pressable w-fit disabled:opacity-70"
        disabled={pending || pendingCount === 0}
      >
        {pending ? "Approving…" : "Approve all registrants"}
      </button>
    </form>
  );
}
