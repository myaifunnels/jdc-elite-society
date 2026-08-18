"use client";

import { useActionState } from "react";

import { AdminLoginState, loginAdmin } from "@/app/login/actions";

const initialState: AdminLoginState = {};

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(loginAdmin, initialState);

  return (
    <form action={formAction} className="glass-panel rounded-[2rem] p-8">
      <p className="eyebrow text-xs">Admin</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
        Sign in to the command center
      </h2>
      <p className="mt-3 text-sm text-[var(--muted)]">
        Use the requested admin credentials to access the full CRM, settings, and design system controls.
      </p>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Username</span>
          <input
            name="username"
            defaultValue="admin"
            className="w-full rounded-2xl border border-[var(--line)] bg-[color:var(--surface-elevated)]/86 px-4 py-3 outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[rgba(184,134,77,0.18)]"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Password</span>
          <input
            type="password"
            name="password"
            defaultValue="admin"
            className="w-full rounded-2xl border border-[var(--line)] bg-[color:var(--surface-elevated)]/86 px-4 py-3 outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[rgba(184,134,77,0.18)]"
          />
        </label>
      </div>

      {state.error ? <p className="mt-4 text-sm text-red-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="button-primary pressable mt-8 rounded-full px-5 py-3 font-semibold disabled:opacity-70"
      >
        {pending ? "Signing in..." : "Sign in as admin"}
      </button>
    </form>
  );
}
