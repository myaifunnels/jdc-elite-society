"use client";

import { ArrowRight, Building2, Lock, Mail, Smartphone, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useState } from "react";
import { useActionState } from "react";

import { AuthFormState, loginAccount, registerAccount } from "@/app/login/actions";
import { PhoneField } from "@/components/forms/phone-field";
import { StickyForm } from "@/components/forms/sticky-form";

const initialState: AuthFormState = {};

const SOCIAL_AUTH_ERRORS: Record<string, string> = {
  google_not_configured: "Google sign-in isn't set up yet.",
  google_failed: "Google sign-in didn't go through — try again.",
  google_email_unverified: "That Google account's email isn't verified.",
  facebook_not_configured: "Facebook sign-in isn't set up yet.",
  facebook_failed: "Facebook sign-in didn't go through — try again.",
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.9-2.26 5.36-4.78 7.02l7.73 6c4.51-4.18 7.09-10.36 7.09-17.49z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59a14.5 14.5 0 0 1-.76-4.59c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.86.92 7.51 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.92-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48z"
      />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.25h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07Z"
      />
    </svg>
  );
}

function AuthField({
  label,
  icon,
  className,
  action,
  children,
}: {
  label: string;
  icon?: ReactNode;
  className?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className={className ? `auth-field ${className}` : "auth-field"}>
      <span className="auth-field-copy">
        <em>{label}</em>
        <span className="auth-input-wrap">
          {icon}
          {children}
        </span>
      </span>
      {action}
    </label>
  );
}

export function AuthPanel({
  mode,
  email = "",
}: {
  mode: "login" | "register";
  email?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const socialAuthError = SOCIAL_AUTH_ERRORS[searchParams.get("error") ?? ""];
  const [loginState, loginAction, loginPending] = useActionState(loginAccount, initialState);
  const [registerState, registerAction, registerPending] = useActionState(registerAccount, initialState);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const fields = registerState.fields;

  return (
    <div className={mode === "login" ? "macos-window is-signin" : "macos-window"}>
      <div className="macos-toolbar">
        <div className="macos-segment" role="tablist" aria-label="Account">
          <button type="button" className={mode === "login" ? "is-active" : ""} onClick={() => router.replace("/login")}>
            Sign In
          </button>
          <button
            type="button"
            className={mode === "register" ? "is-active" : ""}
            onClick={() => router.replace("/register")}
          >
            Register
          </button>
        </div>
      </div>

      <div className="macos-body">
        <h1 className="macos-heading">{mode === "login" ? "Welcome back" : "Join Elite"}</h1>
        <p className="macos-lead">
          {mode === "login"
            ? "Please enter your details to sign in"
            : "Create your JDC Elite account to open the dashboard."}
        </p>

        {socialAuthError ? <p className="auth-error">{socialAuthError}</p> : null}

        <a href="/api/auth/google" className="macos-btn macos-btn-google">
          <GoogleIcon />
          Continue with Google
        </a>

        <a href="/api/auth/facebook" className="macos-btn macos-btn-facebook">
          <FacebookIcon />
          Continue with Facebook
        </a>

        <div className="auth-divider">
          <span>or continue with email</span>
        </div>

        {mode === "login" ? (
          <StickyForm storageKey="coach-jdc-member-login" action={loginAction} className="auth-form auth-form-login">
            <AuthField
              label="Email"
              icon={<Mail size={15} aria-hidden />}
              action={
                <button type="submit" className="macos-go" disabled={loginPending} aria-label="Sign in">
                  <ArrowRight size={16} />
                </button>
              }
            >
              <input
                name="email"
                type="email"
                autoComplete="username"
                placeholder="name@mail.com"
                defaultValue={email}
                data-lock={email ? "true" : undefined}
                required
              />
            </AuthField>

            <AuthField label="Password" icon={<Lock size={15} aria-hidden />}>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                data-sticky="off"
                required
              />
            </AuthField>

            <div className="auth-row">
              <label className="auth-check">
                <input type="checkbox" name="remember" />
                Remember me
              </label>
              <Link href="/forgot-password" className="auth-forgot">
                Forgot password?
              </Link>
            </div>

            {loginState.error ? <p className="auth-error">{loginState.error}</p> : null}

            <div className="macos-actions">
              <p className="auth-switch-copy">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="auth-forgot">
                  Create Account
                </Link>
              </p>
              <button type="submit" className="macos-btn macos-btn-primary" disabled={loginPending}>
                {loginPending ? "Signing In..." : "Sign In"}
              </button>
            </div>
          </StickyForm>
        ) : (
          <StickyForm
            storageKey="coach-jdc-register"
            restoreToken={registerState.formKey}
            action={registerAction}
            className="auth-form auth-form-grid"
          >
            <AuthField label="Full name" icon={<UserRound size={15} aria-hidden />}>
              <input
                name="name"
                autoComplete="name"
                placeholder="Juan Dela Cruz"
                required
                defaultValue={fields?.name ?? ""}
              />
            </AuthField>
            <AuthField label="Email" icon={<Mail size={15} aria-hidden />}>
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@mail.com"
                required
                defaultValue={fields?.email ?? ""}
              />
            </AuthField>
            <AuthField label="Phone" className="auth-span-2" icon={<Smartphone size={15} aria-hidden />}>
              <PhoneField
                key={registerState.formKey ?? "phone"}
                defaultIso={fields?.phoneCountry}
                defaultNational={fields?.phoneNational}
              />
            </AuthField>
            <AuthField label="Company" className="auth-span-2" icon={<Building2 size={15} aria-hidden />}>
              <input
                name="company"
                autoComplete="organization"
                placeholder="Your company"
                required
                defaultValue={fields?.company ?? ""}
              />
            </AuthField>
            <AuthField label="Password" icon={<Lock size={15} aria-hidden />}>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                data-sticky="off"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </AuthField>
            <AuthField
              label="Confirm password"
              icon={<Lock size={15} aria-hidden />}
              action={
                <button type="submit" className="macos-go" disabled={registerPending} aria-label="Create account">
                  <ArrowRight size={16} />
                </button>
              }
            >
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                data-sticky="off"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </AuthField>

            {registerState.error ? <p className="auth-error">{registerState.error}</p> : null}

            <div className="macos-actions">
              <p className="auth-switch-copy">
                Already a member?{" "}
                <Link href="/login" className="auth-forgot">
                  Sign In
                </Link>
              </p>
              <button type="submit" className="macos-btn macos-btn-primary" disabled={registerPending}>
                {registerPending ? "Creating Account..." : "Create Account"}
              </button>
            </div>
          </StickyForm>
        )}
      </div>
    </div>
  );
}
