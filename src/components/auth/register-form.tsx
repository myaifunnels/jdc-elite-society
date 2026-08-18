"use client";

import Link from "next/link";
import { useActionState } from "react";

import { AuthFormState, registerAccount } from "@/app/login/actions";

const initialState: AuthFormState = {};

const inputClass =
  "w-full rounded-2xl border border-[var(--line)] bg-[color:var(--surface-elevated)]/86 px-4 py-3 outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--brand)_22%,transparent)]";

export function RegisterForm({ compact = false }: { compact?: boolean }) {
  const [state, formAction, pending] = useActionState(registerAccount, initialState);

  return (
    <form action={formAction} className={compact ? "grid gap-4" : "glass-panel rounded-[2rem] p-6 sm:p-8"}>
      {compact ? null : (
        <div className="mb-2">
          <p className="eyebrow text-xs">Create your account</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">Register and enter the right room</h2>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Choose how you are joining. The dashboard you see after this depends on that role.
          </p>
        </div>
      )}

      <div className="grid gap-4">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Full name</span>
          <input name="name" autoComplete="name" className={inputClass} placeholder="Juan Dela Cruz" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Email</span>
          <input name="email" type="email" autoComplete="email" className={inputClass} placeholder="you@email.com" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Password</span>
          <input name="password" type="password" autoComplete="new-password" className={inputClass} />
        </label>
        <fieldset className="grid gap-3">
          <legend className="text-sm font-medium">What best describes your role here?</legend>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--line)] px-4 py-3">
            <input type="radio" name="role" value="member" defaultChecked className="mt-1" />
            <span>
              <span className="block font-semibold">Member</span>
              <span className="text-sm text-[var(--muted)]">I&apos;m here to be coached and follow a program track.</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--line)] px-4 py-3">
            <input type="radio" name="role" value="partner" className="mt-1" />
            <span>
              <span className="block font-semibold">Partner</span>
              <span className="text-sm text-[var(--muted)]">I work with Coach JDC on leads and regional follow-through.</span>
            </span>
          </label>
        </fieldset>
      </div>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="button-primary pressable mt-2 rounded-full px-5 py-3 font-semibold disabled:opacity-70"
      >
        {pending ? "Creating account..." : "Create account"}
      </button>

      <p className="text-sm text-[var(--muted)]">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-[var(--brand-dark)]">
          Sign in
        </Link>
      </p>
    </form>
  );
}
