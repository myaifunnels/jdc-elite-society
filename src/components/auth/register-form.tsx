"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { AuthFormState, registerAccount } from "@/app/login/actions";
import { FloatField } from "@/components/forms/float-field";
import { PhoneField } from "@/components/forms/phone-field";
import { StickyForm } from "@/components/forms/sticky-form";

const initialState: AuthFormState = {};

export function RegisterForm({
  compact = false,
  showSignInLink = true,
}: {
  compact?: boolean;
  showSignInLink?: boolean;
}) {
  const [state, formAction, pending] = useActionState(registerAccount, initialState);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const fields = state.fields;

  return (
    <StickyForm
      storageKey="coach-jdc-register"
      restoreToken={state.formKey}
      action={formAction}
      className={compact ? "grid gap-4" : "glass-panel rounded-[2rem] p-6 sm:p-8"}
    >
      {compact ? null : (
        <div className="mb-2">
          <p className="eyebrow text-xs">Create your account</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">Create your account</h2>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Register to open the dashboard. Your account stays pending until we verify you.
          </p>
        </div>
      )}

      <div className="grid gap-4">
        <FloatField label="Full name">
          <input name="name" autoComplete="name" placeholder=" " required defaultValue={fields?.name ?? ""} />
        </FloatField>
        <FloatField label="Email address">
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder=" "
            required
            defaultValue={fields?.email ?? ""}
          />
        </FloatField>
        <div className="phone-field-card">
          <p className="phone-field-label">Phone number</p>
          <PhoneField
            key={state.formKey ?? "phone"}
            defaultIso={fields?.phoneCountry}
            defaultNational={fields?.phoneNational}
          />
        </div>
        <FloatField label="Company">
          <input
            name="company"
            autoComplete="organization"
            placeholder=" "
            required
            defaultValue={fields?.company ?? ""}
          />
        </FloatField>
        <FloatField label="Password">
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder=" "
            data-sticky="off"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </FloatField>
        <FloatField label="Confirm password">
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder=" "
            data-sticky="off"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </FloatField>
      </div>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="button-primary pressable mt-2 rounded-full px-5 py-3 font-semibold disabled:opacity-70"
      >
        {pending ? "Creating account..." : "Create account"}
      </button>

      {showSignInLink ? (
        <p className="text-sm text-[var(--muted)]">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-[var(--brand-dark)]">
            Sign in
          </Link>
        </p>
      ) : null}
    </StickyForm>
  );
}
