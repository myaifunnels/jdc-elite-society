"use client";

import { useActionState } from "react";

import { MemberLoginState, loginMember } from "@/app/login/actions";
import { StickyForm } from "@/components/forms/sticky-form";
import { TEMPORARY_MEMBER_PASSWORD } from "@/lib/auth-constants";

const initialState: MemberLoginState = {};

const inputClass =
  "w-full rounded-2xl border border-[var(--line)] bg-[color:var(--surface-elevated)]/86 px-4 py-3 outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[rgba(184,134,77,0.18)]";

export function MemberLoginForm({
  email = "",
  existing = false,
}: {
  email?: string;
  existing?: boolean;
}) {
  const [state, formAction, pending] = useActionState(loginMember, initialState);

  return (
    <StickyForm storageKey="coach-jdc-member-login" action={formAction} className="glass-panel rounded-[2rem] p-8">
      <p className="eyebrow text-xs">Member access</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">Sign in with your email</h2>
      {existing ? (
        <p className="mt-3 text-sm text-[var(--muted)]">
          That email or phone number is already registered. Log in with the same email. Your temporary password is{" "}
          <strong>{TEMPORARY_MEMBER_PASSWORD}</strong>. After you sign in, you will set a new password and confirmation
          password.
        </p>
      ) : (
        <p className="mt-3 text-sm text-[var(--muted)]">
          Use the email from your inquiry form. If this is your first login, the temporary password is{" "}
          <strong>{TEMPORARY_MEMBER_PASSWORD}</strong>. You will then be asked for a new password and confirmation
          password.
        </p>
      )}

      <div className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={email}
            data-lock={email ? "true" : undefined}
            placeholder="juan@example.com"
            className={inputClass}
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Password</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            data-sticky="off"
            placeholder={TEMPORARY_MEMBER_PASSWORD}
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
        {pending ? "Signing in..." : "Sign in with email"}
      </button>
    </StickyForm>
  );
}
