"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { AuthFormState, resetPasswordAccount } from "@/app/login/actions";
import { SiteLogo } from "@/components/branding/site-logo";
import { BrandingSettings } from "@/lib/branding";

const initialState: AuthFormState = {};

export function ResetPasswordForm({
  branding,
  token,
}: {
  branding: BrandingSettings;
  token: string;
}) {
  const [state, action, pending] = useActionState(resetPasswordAccount, initialState);

  return (
    <div className="macos-window is-signin">
      <header className="macos-titlebar">
        <p className="macos-title">Reset Password</p>
      </header>
      <div className="macos-body">
        <SiteLogo branding={branding} href="/" compact={Boolean(branding.logoUrl)} />
        <form action={action} className="auth-form auth-form-login">
          <p className="macos-lead">
            {token ? "Choose a new password for this account." : "This reset link is missing. Request a new one from Forgot password."}
          </p>
          <input type="hidden" name="token" value={token} />
          <label className="auth-field">
            <span>New password</span>
            <span className="auth-input-wrap">
              <Lock size={15} aria-hidden />
              <input name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" />
            </span>
          </label>
          <label className="auth-field">
            <span>Confirm password</span>
            <span className="auth-input-wrap">
              <Lock size={15} aria-hidden />
              <input name="confirmPassword" type="password" autoComplete="new-password" placeholder="Repeat the password" />
            </span>
          </label>
          {state.error ? <p className="auth-error">{state.error}</p> : null}
          <div className="macos-actions">
            <p className="auth-switch-copy">
              <Link href="/forgot-password" className="auth-forgot">
                Request a new link
              </Link>
            </p>
            <button type="submit" className="macos-btn macos-btn-primary" disabled={pending || !token}>
              {pending ? "Saving..." : "Save Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
