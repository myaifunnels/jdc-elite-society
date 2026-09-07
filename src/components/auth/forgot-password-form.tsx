"use client";

import { Mail, Smartphone } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import { AuthFormState, requestPasswordResetAccount } from "@/app/login/actions";
import { StickyForm } from "@/components/forms/sticky-form";

const initialState: AuthFormState = {};

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAccount, initialState);
  const [channel, setChannel] = useState<"email" | "sms">("email");

  return (
    <div className="macos-window is-signin">
      <header className="macos-titlebar">
        <p className="macos-title">Forgot Password</p>
      </header>
      <div className="macos-body">
        <StickyForm storageKey="coach-jdc-forgot-password" action={action} className="auth-form auth-form-login">
          <p className="macos-lead">
            Enter the email or mobile number on your JDC Elite Society account, then choose how you&apos;d like to
            verify it&apos;s you.
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

          <input type="hidden" name="channel" value={channel} />
          <div className="grid gap-1.5">
            <p className="auth-switch-copy" style={{ margin: 0 }}>
              Send my reset via
            </p>
            <div className="macos-segment" role="tablist" aria-label="Reset verification method">
              <button
                type="button"
                role="tab"
                aria-selected={channel === "email"}
                className={channel === "email" ? "is-active" : ""}
                onClick={() => setChannel("email")}
              >
                <Mail size={14} aria-hidden /> Email
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={channel === "sms"}
                className={channel === "sms" ? "is-active" : ""}
                onClick={() => setChannel("sms")}
              >
                <Smartphone size={14} aria-hidden /> Text
              </button>
            </div>
            <p className="auth-switch-copy">
              {channel === "email"
                ? "We'll email a reset link to the address on file."
                : "We'll text a 6-digit code to the mobile number on file."}
            </p>
          </div>

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
