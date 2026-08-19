"use client";

import { Mail } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { AuthFormState, requestPasswordResetAccount } from "@/app/login/actions";
import { SiteLogo } from "@/components/branding/site-logo";
import { BrandingSettings } from "@/lib/branding";

const initialState: AuthFormState = {};

export function ForgotPasswordForm({ branding }: { branding: BrandingSettings }) {
  const [state, action, pending] = useActionState(requestPasswordResetAccount, initialState);

  return (
    <div className="macos-window is-signin">
      <header className="macos-titlebar">
        <p className="macos-title">Forgot Password</p>
      </header>
      <div className="macos-body">
        <SiteLogo branding={branding} href="/" compact={Boolean(branding.logoUrl)} />
        <form action={action} className="auth-form auth-form-login">
          <p className="macos-lead">Enter the email on your account. If it matches, we will send a reset link.</p>
          <label className="auth-field">
            <span>Email</span>
            <span className="auth-input-wrap">
              <Mail size={15} aria-hidden />
              <input name="email" type="email" autoComplete="username" placeholder="name@mail.com" required />
            </span>
          </label>
          {state.error ? <p className="auth-error">{state.error}</p> : null}
          {state.success ? <p className="auth-success">{state.success}</p> : null}
          <div className="macos-actions">
            <p className="auth-switch-copy">
              Remembered it?{" "}
              <Link href="/login" className="auth-forgot">
                Sign In
              </Link>
            </p>
            <button type="submit" className="macos-btn macos-btn-primary" disabled={pending}>
              {pending ? "Sending..." : "Send Reset Link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
