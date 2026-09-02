"use client";

import { Mail, Smartphone } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { AuthFormState, requestPasswordResetAccount } from "@/app/login/actions";
import { SiteLogo } from "@/components/branding/site-logo";
import { StickyForm } from "@/components/forms/sticky-form";
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
        <StickyForm storageKey="coach-jdc-forgot-password" action={action} className="auth-form auth-form-login">
          <p className="macos-lead">
            Enter the email or mobile number on your JDC Elite Society account. We will send a reset link to email and a
            6-digit code by text.
          </p>
          <label className="auth-field">
            <span>Email or mobile</span>
            <span className="auth-input-wrap">
              <Mail size={15} aria-hidden />
              <input
                name="identifier"
                type="text"
                autoComplete="username"
                placeholder="name@mail.com or 09XXXXXXXXX"
                required
              />
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
              {" · "}
              <Link href="/reset-password" className="auth-forgot">
                I have a text code
              </Link>
            </p>
            <button type="submit" className="macos-btn macos-btn-primary" disabled={pending}>
              {pending ? "Sending..." : "Send Reset"}
            </button>
          </div>
          <p className="auth-switch-copy" style={{ marginTop: "0.75rem" }}>
            <Smartphone size={13} aria-hidden /> Texts use GHL, TextBee, or Twilio from Integrations.
          </p>
        </StickyForm>
      </div>
    </div>
  );
}
