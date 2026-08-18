"use client";

import { Calendar, Image as ImageIcon, Lock, Mail, MapPin, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, type ReactNode } from "react";

import { AuthFormState, loginAccount, registerAccount } from "@/app/login/actions";
import { SiteLogo } from "@/components/branding/site-logo";
import { AddressAutocomplete } from "@/components/forms/address-autocomplete";
import { BrandingSettings } from "@/lib/branding";
import { audienceOptions } from "@/lib/validations";

const initialState: AuthFormState = {};

function AuthField({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="auth-field">
      <span>{label}</span>
      <span className="auth-input-wrap">
        {icon}
        {children}
      </span>
    </label>
  );
}

export function AuthPanel({
  branding,
  mode,
}: {
  branding: BrandingSettings;
  mode: "login" | "register";
}) {
  const router = useRouter();
  const [loginState, loginAction, loginPending] = useActionState(loginAccount, initialState);
  const [registerState, registerAction, registerPending] = useActionState(registerAccount, initialState);

  return (
    <div className="auth-card">
      <SiteLogo branding={branding} href="/" compact={Boolean(branding.logoUrl)} />

      <div className="auth-mode-toggle" role="tablist" aria-label="Account">
        <button type="button" className={mode === "login" ? "is-active" : ""} onClick={() => router.replace("/login")}>
          Sign in
        </button>
        <button
          type="button"
          className={mode === "register" ? "is-active" : ""}
          onClick={() => router.replace("/register")}
        >
          Register
        </button>
      </div>

      {mode === "login" ? (
        <form action={loginAction} className="auth-form auth-form-grid">
          <AuthField label="Email address" icon={<Mail size={16} aria-hidden />}>
            <input name="email" type="email" autoComplete="email" placeholder="name@mail.com" />
          </AuthField>

          <AuthField label="Password" icon={<Lock size={16} aria-hidden />}>
            <input name="password" type="password" autoComplete="current-password" placeholder="••••••••" />
          </AuthField>

          <div className="auth-row">
            <label className="auth-check">
              <input type="checkbox" name="remember" />
              Remember me
            </label>
            <Link href="/contact" className="auth-forgot">
              Forgot password?
            </Link>
          </div>

          {loginState.error ? <p className="auth-error">{loginState.error}</p> : null}

          <button type="submit" className="auth-btn-login auth-btn-active" disabled={loginPending}>
            {loginPending ? "Signing in..." : "Sign in"}
          </button>

          <p className="auth-switch-copy">
            Not a member yet?{" "}
            <Link href="/register" className="auth-forgot">
              Register
            </Link>
          </p>
        </form>
      ) : (
        <form action={registerAction} className="auth-form auth-form-grid">
          <AuthField label="Full name" icon={<UserRound size={16} aria-hidden />}>
            <input name="name" autoComplete="name" placeholder="Juan Dela Cruz" />
          </AuthField>

          <AuthField label="Email address" icon={<Mail size={16} aria-hidden />}>
            <input name="email" type="email" autoComplete="email" placeholder="name@mail.com" />
          </AuthField>

          <AuthField label="Password" icon={<Lock size={16} aria-hidden />}>
            <input name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" />
          </AuthField>

          <AuthField label="Date of birth" icon={<Calendar size={16} aria-hidden />}>
            <input name="dateOfBirth" type="date" autoComplete="bday" required />
          </AuthField>

          <AuthField label="Address" icon={<MapPin size={16} aria-hidden />}>
            <AddressAutocomplete name="address" placeholder="Street, city, province or country" />
          </AuthField>

          <AuthField label="What best describes you?">
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
          </AuthField>

          <AuthField label="Facebook profile URL" icon={<UserRound size={16} aria-hidden />}>
            <input name="facebookProfileUrl" type="url" autoComplete="url" placeholder="https://facebook.com/your.profile" />
          </AuthField>

          <AuthField label="Facebook profile picture URL" icon={<ImageIcon size={16} aria-hidden />}>
            <input name="facebookPhotoUrl" type="url" placeholder="https://... your Facebook photo" />
          </AuthField>

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
      )}
    </div>
  );
}
