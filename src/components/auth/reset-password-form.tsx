"use client";

import { KeyRound, Lock, Mail } from "lucide-react";
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
  const hasLink = token.trim().length >= 20;

  return (
    <div className="macos-window is-signin">
      <header className="macos-titlebar">
        <p className="macos-title">Reset Password</p>
      </header>
      <div className="macos-body">
        <SiteLogo branding={branding} href="/" compact={Boolean(branding.logoUrl)} />
        <form action={action} className="auth-form auth-form-login">
          <p className="macos-lead">
            {hasLink
              ? "Choose a new password for this account."
              : "Enter the email or mobile you used, plus the 6-digit code we texted you."}
          </p>
          <input type="hidden" name="token" value={token} />
          {hasLink ? null : (
            <>
              <label className="auth-field">
                <span>Email or mobile</span>
                <span className="auth-input-wrap">
                  <Mail size={15} aria-hidden />
                  <input name="identifier" type="text" autoComplete="username" placeholder="name@mail.com or 09XXXXXXXXX" />
                </span>
              </label>
              <label className="auth-field">
                <span>Text code</span>
                <span className="auth-input-wrap">
                  <KeyRound size={15} aria-hidden />
                  <input name="code" inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit code" />
                </span>
              </label>
            </>
          )}
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
                Request a new code
              </Link>
            </p>
            <button type="submit" className="macos-btn macos-btn-primary" disabled={pending}>
              {pending ? "Saving..." : "Save Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
