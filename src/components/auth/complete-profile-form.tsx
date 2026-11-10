"use client";

import { useActionState, useState } from "react";

import { AuthFormState, completeAccountProfile } from "@/app/login/actions";
import { AddressAutocomplete } from "@/components/forms/address-autocomplete";
import { PhotoUploadField } from "@/components/forms/photo-upload-field";
import { StickyForm } from "@/components/forms/sticky-form";
import { audienceOptions } from "@/lib/validations";

const initialState: AuthFormState = {};

export function CompleteProfileForm() {
  const [state, formAction, pending] = useActionState(completeAccountProfile, initialState);
  const [audience, setAudience] = useState("");

  return (
    <StickyForm storageKey="coach-jdc-complete-profile" action={formAction} className="grid gap-4" encType="multipart/form-data">
      <PhotoUploadField required />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="auth-field">
          <span>Date of birth</span>
          <span className="auth-input-wrap">
            <input name="dateOfBirth" type="date" autoComplete="bday" required />
          </span>
        </label>
        <label className="auth-field">
          <span>What best describes you?</span>
          <span className="auth-input-wrap">
            <select
              name="bestDescribesYou"
              value={audience}
              required
              onChange={(event) => setAudience(event.target.value)}
            >
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
        {audience === "Other" ? (
          <label className="auth-field md:col-span-2">
            <span>Tell us what “other” is</span>
            <span className="auth-input-wrap">
              <input
                name="bestDescribesYouOther"
                placeholder="e.g. Homemaker, student, freelancer"
                required
              />
            </span>
          </label>
        ) : null}
        <label className="auth-field md:col-span-2">
          <span>Address</span>
          <span className="auth-input-wrap">
            <AddressAutocomplete name="address" placeholder="Street, city, province or country" />
          </span>
        </label>
        <label className="auth-field md:col-span-2">
          <span>Facebook profile URL</span>
          <span className="auth-input-wrap">
            <input name="facebookProfileUrl" type="url" placeholder="https://facebook.com/your.profile" />
          </span>
        </label>
      </div>

      {state.error ? <p className="auth-error">{state.error}</p> : null}

      <button type="submit" className="macos-btn macos-btn-primary self-start" disabled={pending}>
        {pending ? "Saving your profile..." : "Lock in my profile"}
      </button>
    </StickyForm>
  );
}
