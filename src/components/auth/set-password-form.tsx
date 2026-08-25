"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import { useActionState, useState } from "react";

import { AuthFormState, changeSignedInPassword } from "@/app/login/actions";
import { SiteLogo } from "@/components/branding/site-logo";
import { PhotoUploadField } from "@/components/forms/photo-upload-field";
import { BrandingSettings } from "@/lib/branding";

const initialState: AuthFormState = {};

function PasswordField({
  name,
  label,
  placeholder,
  autoComplete,
}: {
  name: string;
  label: string;
  placeholder: string;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="auth-field">
      <span>{label}</span>
      <span className="auth-input-wrap">
        <Lock size={15} aria-hidden />
        <input
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          minLength={8}
          required
        />
        <button
          type="button"
          className="auth-input-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff size={15} aria-hidden /> : <Eye size={15} aria-hidden />}
        </button>
      </span>
    </label>
  );
}

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

          <div className="auth-form-section">
            <p className="auth-form-section-label">Profile photo</p>
            <PhotoUploadField defaultUrl={photoUrl} />
          </div>

          <div className="auth-form-section">
            <p className="auth-form-section-label">New password</p>
            <PasswordField name="password" label="New password" placeholder="At least 8 characters" autoComplete="new-password" />
            <PasswordField
              name="confirmPassword"
              label="Confirmation password"
              placeholder="Repeat the password"
              autoComplete="new-password"
            />
          </div>

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
