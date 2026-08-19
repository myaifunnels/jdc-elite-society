"use client";

import { Lock } from "lucide-react";
import { useActionState } from "react";

import { AuthFormState, changeSignedInPassword } from "@/app/login/actions";
import { SiteLogo } from "@/components/branding/site-logo";
import { BrandingSettings } from "@/lib/branding";

const initialState: AuthFormState = {};

export function SetPasswordForm({ branding, email }: { branding: BrandingSettings; email: string }) {
  const [state, action, pending] = useActionState(changeSignedInPassword, initialState);

  return (
    <div className="macos-window is-signin">
      <header className="macos-titlebar">
        <p className="macos-title">New Password</p>
      </header>
      <div className="macos-body">
        <SiteLogo branding={branding} href="/" compact={Boolean(branding.logoUrl)} />
        <form action={action} className="auth-form auth-form-login">
          <p className="macos-lead">
            You signed in as {email} with the temporary password. Enter a new password, then confirm it.
          </p>
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
              {pending ? "Saving..." : "Save new password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
