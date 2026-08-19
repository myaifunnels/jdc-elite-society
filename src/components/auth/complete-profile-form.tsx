"use client";

import { useActionState, useEffect, useState } from "react";

import { AuthFormState, completeAccountProfile } from "@/app/login/actions";
import { AddressAutocomplete } from "@/components/forms/address-autocomplete";
import { membershipTheme, type Membership } from "@/lib/membership";
import { audienceOptions } from "@/lib/validations";

const initialState: AuthFormState = {};

export function CompleteProfileForm() {
  const [state, formAction, pending] = useActionState(completeAccountProfile, initialState);
  const [memberships, setMemberships] = useState<Membership[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.dataset.membership ?? "";
    const next = membershipTheme(memberships);
    if (next) {
      root.dataset.membership = next;
    } else {
      delete root.dataset.membership;
    }

    return () => {
      if (previous) {
        root.dataset.membership = previous;
      } else {
        delete root.dataset.membership;
      }
    };
  }, [memberships]);

  function toggleMembership(value: Membership) {
    setMemberships((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="auth-field">
          <span>Create a password</span>
          <span className="auth-input-wrap">
            <input name="password" type="password" autoComplete="new-password" required />
          </span>
        </label>
        <label className="auth-field">
          <span>Confirm password</span>
          <span className="auth-input-wrap">
            <input name="confirmPassword" type="password" autoComplete="new-password" required />
          </span>
        </label>
        <label className="auth-field">
          <span>Date of birth</span>
          <span className="auth-input-wrap">
            <input name="dateOfBirth" type="date" autoComplete="bday" required />
          </span>
        </label>
        <label className="auth-field">
          <span>What best describes you?</span>
          <span className="auth-input-wrap">
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
        <label className="auth-field md:col-span-2">
          <span>Address</span>
          <span className="auth-input-wrap">
            <AddressAutocomplete name="address" placeholder="Street, city, province or country" />
          </span>
        </label>
        <label className="auth-field">
          <span>Facebook profile URL</span>
          <span className="auth-input-wrap">
            <input name="facebookProfileUrl" type="url" placeholder="https://facebook.com/your.profile" />
          </span>
        </label>
        <label className="auth-field">
          <span>Facebook photo URL</span>
          <span className="auth-input-wrap">
            <input name="facebookPhotoUrl" type="url" placeholder="https://... your Facebook photo" />
          </span>
        </label>
      </div>

      <fieldset className="auth-roles">
        <legend>Your role here</legend>
        <div className="auth-roles-row">
          <label>
            <input
              type="checkbox"
              name="memberships"
              value="spartan"
              checked={memberships.includes("spartan")}
              onChange={() => toggleMembership("spartan")}
            />
            Spartans
          </label>
          <label>
            <input
              type="checkbox"
              name="memberships"
              value="jes"
              checked={memberships.includes("jes")}
              onChange={() => toggleMembership("jes")}
            />
            JES Member
          </label>
        </div>
        <p className="auth-note">
          JES means JDC Elite Society. Select Spartans, JES Member, or both. Completing this profile
          is required before our team can verify your account.
        </p>
      </fieldset>

      {state.error ? <p className="auth-error">{state.error}</p> : null}

      <button type="submit" className="macos-btn macos-btn-primary self-start" disabled={pending}>
        {pending ? "Saving profile..." : "Save profile"}
      </button>
    </form>
  );
}
