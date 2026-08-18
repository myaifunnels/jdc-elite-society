"use client";

import { Calendar, Image as ImageIcon, Lock, Mail, MapPin, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState } from "react";

import { AuthFormState, registerAccount } from "@/app/login/actions";
import { SiteLogo } from "@/components/branding/site-logo";
import { AddressAutocomplete } from "@/components/forms/address-autocomplete";
import { FloatField } from "@/components/forms/float-field";
import { BrandingSettings } from "@/lib/branding";
import { audienceOptions } from "@/lib/validations";

const initialState: AuthFormState = {};

export function RegisterCard({ branding }: { branding: BrandingSettings }) {
  const router = useRouter();
  const [registerState, registerAction, registerPending] = useActionState(registerAccount, initialState);

  return (
    <div className="auth-card">
      <SiteLogo branding={branding} href="/" compact={Boolean(branding.logoUrl)} />

      <div className="auth-mode-toggle" role="tablist" aria-label="Account">
        <button type="button" onClick={() => router.replace("/login")}>
          Sign in
        </button>
        <button type="button" className="is-active">
          Register
        </button>
      </div>

      <form action={registerAction} className="auth-form auth-form-register">
        <FloatField label="Enter your full name" icon={<UserRound size={16} aria-hidden />}>
          <input name="name" autoComplete="name" placeholder=" " />
        </FloatField>

        <FloatField label="Enter your email address" icon={<Mail size={16} aria-hidden />}>
          <input name="email" type="email" autoComplete="email" placeholder=" " />
        </FloatField>

        <FloatField label="Create a password" icon={<Lock size={16} aria-hidden />}>
          <input name="password" type="password" autoComplete="new-password" placeholder=" " />
        </FloatField>

        <FloatField label="Enter your date of birth" icon={<Calendar size={16} aria-hidden />}>
          <input name="dateOfBirth" type="date" autoComplete="bday" required />
        </FloatField>

        <FloatField label="Enter your address" icon={<MapPin size={16} aria-hidden />}>
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

        <FloatField label="Enter your Facebook profile URL" icon={<UserRound size={16} aria-hidden />}>
          <input name="facebookProfileUrl" type="url" autoComplete="url" placeholder=" " />
        </FloatField>

        <FloatField label="Enter your Facebook photo URL" icon={<ImageIcon size={16} aria-hidden />}>
          <input name="facebookPhotoUrl" type="url" placeholder=" " />
        </FloatField>

        <fieldset className="auth-roles">
          <legend>What best describes your role here?</legend>
          <div className="auth-roles-row">
            <label>
              <input type="radio" name="role" value="member" defaultChecked />
              Member
            </label>
            <label>
              <input type="radio" name="role" value="partner" />
              Partner
            </label>
          </div>
        </fieldset>

        {registerState.error ? <p className="auth-error">{registerState.error}</p> : null}

        <button type="submit" className="auth-btn-signup auth-btn-active" disabled={registerPending}>
          {registerPending ? "Creating account..." : "Register"}
        </button>

        <p className="auth-switch-copy">
          Already a member?{" "}
          <Link href="/login" className="auth-forgot">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
