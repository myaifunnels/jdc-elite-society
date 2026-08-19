"use client";

import { Building2, Lock, Mail, Smartphone, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { useActionState } from "react";

import { AuthFormState, loginAccount, registerAccount } from "@/app/login/actions";
import { SiteLogo } from "@/components/branding/site-logo";
import { PhoneField } from "@/components/forms/phone-field";
import { BrandingSettings } from "@/lib/branding";

const initialState: AuthFormState = {};

function AuthField({
  label,
  icon,
  className,
  children,
}: {
  label: string;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className ? `auth-field ${className}` : "auth-field"}>
      <span>{label}</span>
      <span className="auth-input-wrap">
        {icon}
        {children}
      </span>
    </div>
  );
}

export function AuthPanel({
  branding,
  mode,
}: {
  branding: BrandingSettings;
  mode: "login" | "register";
}) {
  const router = useRouter();
  const [loginState, loginAction, loginPending] = useActionState(loginAccount, initialState);
  const [registerState, registerAction, registerPending] = useActionState(registerAccount, initialState);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const windowTitle = mode === "login" ? "Sign In" : "Register";
  const fields = registerState.fields;

  return (
    <div className={mode === "login" ? "macos-window is-signin" : "macos-window"}>
      <header className="macos-titlebar">
        <p className="macos-title">{windowTitle}</p>
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

        {mode === "login" ? (
          <form action={loginAction} className="auth-form auth-form-login">
            <p className="macos-lead">
              Sign in with your email and password. If you can&apos;t sign in, register first.
            </p>

            <AuthField label="Email" icon={<Mail size={15} aria-hidden />}>
              <input name="email" type="email" autoComplete="username" placeholder="name@mail.com" required />
            </AuthField>

            <AuthField label="Password" icon={<Lock size={15} aria-hidden />}>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
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
                Can&apos;t sign in?{" "}
                <Link href="/register" className="auth-forgot">
                  Register first
                </Link>
              </p>
              <button type="submit" className="macos-btn macos-btn-primary" disabled={loginPending}>
                {loginPending ? "Signing In..." : "Sign In"}
              </button>
            </div>
          </form>
        ) : (
          <form
            key={registerState.formKey ?? "register"}
            action={registerAction}
            className="auth-form auth-form-grid"
          >
            <p className="macos-lead">Create your account to open the dashboard.</p>

            <AuthField label="Full name" icon={<UserRound size={15} aria-hidden />}>
              <input
                name="name"
                autoComplete="name"
                placeholder="Juan Dela Cruz"
                required
                defaultValue={fields?.name ?? ""}
              />
            </AuthField>
            <AuthField label="Email address" icon={<Mail size={15} aria-hidden />}>
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@mail.com"
                required
                defaultValue={fields?.email ?? ""}
              />
            </AuthField>
            <AuthField label="Phone number" className="auth-span-2" icon={<Smartphone size={15} aria-hidden />}>
              <PhoneField defaultIso={fields?.phoneCountry} defaultNational={fields?.phoneNational} />
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
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </AuthField>
            <AuthField label="Confirm password" icon={<Lock size={15} aria-hidden />}>
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your password"
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
          </form>
        )}
      </div>
    </div>
  );
}
