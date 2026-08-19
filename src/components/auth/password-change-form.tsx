"use client";

import { useActionState } from "react";

import { PasswordChangeState, changeMemberPassword } from "@/app/login/actions";

const initialState: PasswordChangeState = {};

const inputClass =
  "w-full rounded-2xl border border-[var(--line)] bg-[color:var(--surface-elevated)]/86 px-4 py-3 outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[rgba(184,134,77,0.18)]";

export function PasswordChangeForm() {
  const [state, formAction, pending] = useActionState(changeMemberPassword, initialState);

  return (
    <form action={formAction} className="glass-panel rounded-[2rem] p-8">
      <p className="eyebrow text-xs">Secure your account</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">Choose a new password</h2>
      <p className="mt-3 text-sm text-[var(--muted)]">
        You signed in with the temporary password. Enter a new password, then confirm it.
      </p>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">New password</span>
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            className={inputClass}
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Confirmation password</span>
          <input
            type="password"
            name="confirmation"
            autoComplete="new-password"
            minLength={8}
            className={inputClass}
          />
        </label>
      </div>

      {state.error ? <p className="mt-4 text-sm text-red-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="button-primary pressable mt-8 rounded-full px-5 py-3 font-semibold disabled:opacity-70"
      >
        {pending ? "Saving..." : "Save new password"}
      </button>
    </form>
  );
}
