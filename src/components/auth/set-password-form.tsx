"use client";

import { Lock } from "lucide-react";
import { useActionState } from "react";

import { AuthFormState, changeSignedInPassword } from "@/app/login/actions";
import { SiteLogo } from "@/components/branding/site-logo";
import { PhotoUploadField } from "@/components/forms/photo-upload-field";
import { BrandingSettings } from "@/lib/branding";

const initialState: AuthFormState = {};

export function SetPasswordForm({
  branding,
  email,
  photoUrl = "",
}: {
  branding: BrandingSettings;
  email: string;
  photoUrl?: string;
}) {
  const [state, action, pending] = useActionState(changeSignedInPassword, initialState);

  return (
    <div className="macos-window is-signin">
      <header className="macos-titlebar">
        <p className="macos-title">Finish Setting Up</p>
      </header>
      <div className="macos-body">
        <SiteLogo branding={branding} href="/" compact={Boolean(branding.logoUrl)} />
        <form action={action} className="auth-form auth-form-login" encType="multipart/form-data">
          <p className="macos-lead">
            You&apos;re signed in as {email}. Add your profile photo, then set a password only you know.
          </p>
          <PhotoUploadField defaultUrl={photoUrl} />
          <label className="auth-field">
            <span>New password</span>
            <span className="auth-input-wrap">
              <Lock size={15} aria-hidden />
              <input name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" required />
            </span>
          </label>
          <label className="auth-field">
            <span>Confirmation password</span>
            <span className="auth-input-wrap">
              <Lock size={15} aria-hidden />
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat the password"
                required
              />
            </span>
          </label>
          {state.error ? <p className="auth-error">{state.error}</p> : null}
          <div className="macos-actions">
            <button type="submit" className="macos-btn macos-btn-primary" disabled={pending}>
              {pending ? "Saving..." : "Finish setup & open dashboard"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
