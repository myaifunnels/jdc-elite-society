"use client";

import Link from "next/link";
import { useActionState } from "react";

import { AuthFormState, loginAccount } from "@/app/login/actions";

const initialState: AuthFormState = {};

const inputClass =
  "w-full rounded-2xl border border-[var(--line)] bg-[color:var(--surface-elevated)]/86 px-4 py-3 outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--brand)_22%,transparent)]";

export function LoginForm({ showRegisterLink = true }: { showRegisterLink?: boolean }) {
  const [state, formAction, pending] = useActionState(loginAccount, initialState);

  return (
    <form action={formAction} className="glass-panel rounded-[2rem] p-6 sm:p-8">
      <p className="eyebrow text-xs">Sign in</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">Enter your dashboard</h2>
      <p className="mt-3 text-sm text-[var(--muted)]">
        We&apos;ll open the workspace that matches your role — member, partner, or admin.
      </p>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Email</span>
          <input name="email" type="email" autoComplete="email" className={inputClass} placeholder="you@email.com" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Password</span>
          <input name="password" type="password" autoComplete="current-password" className={inputClass} />
        </label>
      </div>

      {state.error ? <p className="mt-4 text-sm text-red-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="button-primary pressable mt-8 rounded-full px-5 py-3 font-semibold disabled:opacity-70"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>

      {showRegisterLink ? (
        <p className="mt-4 text-sm text-[var(--muted)]">
          New here?{" "}
          <Link href="/register" className="font-semibold text-[var(--brand-dark)]">
            Register
          </Link>
        </p>
      ) : null}
    </form>
  );
}
