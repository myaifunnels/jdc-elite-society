"use client";

import Link from "next/link";
import { useActionState } from "react";

import { AuthFormState, loginAccount } from "@/app/login/actions";
import { FloatField } from "@/components/forms/float-field";

const initialState: AuthFormState = {};

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
        <FloatField label="Enter your email address">
          <input name="email" type="email" autoComplete="email" placeholder=" " />
        </FloatField>
        <FloatField label="Enter your password">
          <input name="password" type="password" autoComplete="current-password" placeholder=" " />
        </FloatField>
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
