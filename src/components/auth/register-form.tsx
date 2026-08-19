"use client";

import Link from "next/link";
import { useActionState } from "react";

import { AuthFormState, registerAccount } from "@/app/login/actions";
import { AddressAutocomplete } from "@/components/forms/address-autocomplete";
import { FloatField } from "@/components/forms/float-field";
import { audienceOptions } from "@/lib/validations";

const initialState: AuthFormState = {};

export function RegisterForm({
  compact = false,
  showSignInLink = true,
}: {
  compact?: boolean;
  showSignInLink?: boolean;
}) {
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
        <FloatField label="Enter your full name">
          <input name="name" autoComplete="name" placeholder=" " />
        </FloatField>
        <FloatField label="Enter your email address">
          <input name="email" type="email" autoComplete="email" placeholder=" " />
        </FloatField>
        <FloatField label="Create a password">
          <input name="password" type="password" autoComplete="new-password" placeholder=" " />
        </FloatField>
        <FloatField label="Confirm your password">
          <input name="confirmPassword" type="password" autoComplete="new-password" placeholder=" " />
        </FloatField>
        <FloatField label="Enter your date of birth">
          <input name="dateOfBirth" type="date" autoComplete="bday" required />
        </FloatField>
        <FloatField label="Enter your address">
          <AddressAutocomplete name="address" placeholder=" " />
        </FloatField>
        <FloatField label="What best describes you?">
          <select name="bestDescribesYou" defaultValue="" required>
            <option value="" disabled hidden />
            {audienceOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </FloatField>
        <FloatField label="Enter your Facebook profile URL">
          <input name="facebookProfileUrl" type="url" placeholder=" " />
        </FloatField>
        <FloatField label="Enter your Facebook photo URL">
          <input name="facebookPhotoUrl" type="url" placeholder=" " />
        </FloatField>
        <fieldset className="grid gap-3">
          <legend className="text-sm font-medium">Your role here</legend>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--line)] px-4 py-3">
            <input type="checkbox" name="memberships" value="spartan" className="mt-1" />
            <span>
              <span className="block font-semibold">Spartans</span>
              <span className="text-sm text-[var(--muted)]">Join the Spartans track.</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--line)] px-4 py-3">
            <input type="checkbox" name="memberships" value="jes" className="mt-1" />
            <span>
              <span className="block font-semibold">JES Member</span>
              <span className="text-sm text-[var(--muted)]">JES means JDC Elite Society.</span>
            </span>
          </label>
          <p className="text-sm text-[var(--muted)]">
            You can select Spartans, JES Member, or both.
          </p>
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

      {showSignInLink ? (
        <p className="text-sm text-[var(--muted)]">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-[var(--brand-dark)]">
            Sign in
          </Link>
        </p>
      ) : null}
    </form>
  );
}
