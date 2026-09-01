"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight } from "lucide-react";

import { AuthFormState, loginAccount } from "@/app/login/actions";

const initialState: AuthFormState = {};

export function LoginForm({ showRegisterLink = true }: { showRegisterLink?: boolean }) {
  const [state, formAction, pending] = useActionState(loginAccount, initialState);

  return (
    <form action={formAction} className="glass-panel rounded-[2rem] p-6 sm:p-8">
      <div className="relative z-[1] text-center">
        <h2 className="text-3xl font-semibold tracking-[-0.04em]">Welcome back</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">Please enter your details to sign in</p>
      </div>

      <div className="relative z-[1] mt-6 grid gap-3">
        <label className="macos-field">
          <span className="macos-field-copy">
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" placeholder="you@email.com" />
          </span>
          <button type="submit" className="macos-go" disabled={pending} aria-label="Sign in">
            <ArrowRight size={16} />
          </button>
        </label>
        <label className="macos-field">
          <span className="macos-field-copy">
            <span>Password</span>
            <input name="password" type="password" autoComplete="current-password" placeholder="••••••••" />
          </span>
        </label>
      </div>

      {state.error ? <p className="relative z-[1] mt-4 text-sm text-red-500">{state.error}</p> : null}

      {showRegisterLink ? (
        <p className="relative z-[1] mt-4 text-center text-sm text-[var(--muted)]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-[var(--brand)] underline underline-offset-4">
            Create Account
          </Link>
        </p>
      ) : null}
    </form>
  );
}
