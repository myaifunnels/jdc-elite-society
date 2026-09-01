"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight } from "lucide-react";

import { AuthFormState, registerAccount } from "@/app/login/actions";
import { AddressAutocomplete } from "@/components/forms/address-autocomplete";
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
    <form action={formAction} className={compact ? "auth-form" : "glass-panel rounded-[2rem] p-6 sm:p-8"}>
      {compact ? null : (
        <div className="relative z-[1] mb-6 text-center">
          <h2 className="text-3xl font-semibold tracking-[-0.04em]">Join Elite</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Create your JDC Elite account and open the right room.</p>
        </div>
      )}

      <div className="relative z-[1] grid gap-3">
        <label className="macos-field">
          <span className="macos-field-copy">
            <span>Full name</span>
            <input name="name" autoComplete="name" placeholder="Juan Dela Cruz" />
          </span>
        </label>
        <label className="macos-field">
          <span className="macos-field-copy">
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" placeholder="you@email.com" />
          </span>
        </label>
        <label className="macos-field">
          <span className="macos-field-copy">
            <span>Password</span>
            <input name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" />
          </span>
        </label>
        <label className="macos-field">
          <span className="macos-field-copy">
            <span>Date of birth</span>
            <input name="dateOfBirth" type="date" autoComplete="bday" required />
          </span>
        </label>
        <label className="macos-field">
          <span className="macos-field-copy">
            <span>Address</span>
            <AddressAutocomplete name="address" />
          </span>
        </label>
        <label className="macos-field">
          <span className="macos-field-copy">
            <span>What best describes you?</span>
            <select name="bestDescribesYou" defaultValue="" required>
              <option value="" disabled>
                Select one
              </option>
              {audienceOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </span>
        </label>
        <label className="macos-field">
          <span className="macos-field-copy">
            <span>Facebook profile URL</span>
            <input name="facebookProfileUrl" type="url" placeholder="https://facebook.com/your.profile" />
          </span>
        </label>
        <label className="macos-field">
          <span className="macos-field-copy">
            <span>Facebook photo URL</span>
            <input name="facebookPhotoUrl" type="url" placeholder="https://..." />
          </span>
        </label>
        <fieldset className="auth-roles">
          <legend>What best describes your role here?</legend>
          <label className="macos-choice">
            <input type="radio" name="role" value="member" defaultChecked />
            <span>
              <span className="block font-semibold">Member</span>
              <span className="text-sm text-[var(--muted)]">I&apos;m here to be coached and follow a program track.</span>
            </span>
          </label>
          <label className="macos-choice">
            <input type="radio" name="role" value="partner" />
            <span>
              <span className="block font-semibold">Partner</span>
              <span className="text-sm text-[var(--muted)]">I work with Coach JDC on leads and regional follow-through.</span>
            </span>
          </label>
        </fieldset>
      </div>

      {state.error ? <p className="relative z-[1] mt-3 text-sm text-red-500">{state.error}</p> : null}

      <button type="submit" className="macos-field relative z-[1] mt-2 w-full cursor-pointer text-left" disabled={pending}>
        <span className="macos-field-copy">
          <span>JDC Elite</span>
          <strong>{pending ? "Creating account..." : "Create account"}</strong>
        </span>
        <span className="macos-go" aria-hidden>
          <ArrowRight size={16} />
        </span>
      </button>

      {showSignInLink ? (
        <p className="relative z-[1] mt-4 text-center text-sm text-[var(--muted)]">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-[var(--brand)] underline underline-offset-4">
            Sign in
          </Link>
        </p>
      ) : null}
    </form>
  );
}
