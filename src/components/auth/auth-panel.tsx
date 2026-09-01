"use client";

import { ArrowRight, Building2, Lock, Mail, Smartphone, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { useActionState } from "react";

import { AuthFormState, loginAccount, registerAccount } from "@/app/login/actions";
import { SiteLogo } from "@/components/branding/site-logo";
import { PhoneField } from "@/components/forms/phone-field";
import { StickyForm } from "@/components/forms/sticky-form";
import { BrandingSettings } from "@/lib/branding";

const initialState: AuthFormState = {};

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
  branding,
  mode,
  email = "",
}: {
  branding: BrandingSettings;
  mode: "login" | "register";
  email?: string;
}) {
  const router = useRouter();
  const [loginState, loginAction, loginPending] = useActionState(loginAccount, initialState);
  const [registerState, registerAction, registerPending] = useActionState(registerAccount, initialState);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const fields = registerState.fields;

  return (
    <div className={mode === "login" ? "macos-window is-signin" : "macos-window"}>
      <header className="macos-titlebar">
        <p className="macos-title">{mode === "login" ? "Sign In" : "Register"}</p>
      </header>

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
        <SiteLogo branding={branding} href="/" compact={Boolean(branding.logoUrl)} />

        <div className="macos-mark" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="9" cy="9" r="2.4" fill="currentColor" />
          </svg>
        </div>
        <h1 className="macos-heading">{mode === "login" ? "Welcome back" : "Join Elite"}</h1>
        <p className="macos-lead">
          {mode === "login"
            ? "Please enter your details to sign in"
            : "Create your JDC Elite account to open the dashboard."}
        </p>

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
