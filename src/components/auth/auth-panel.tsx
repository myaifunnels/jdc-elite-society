"use client";

import { Building2, Lock, Mail, Smartphone, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode } from "react";
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
  const windowTitle = mode === "login" ? "Sign In" : "Register";

  return (
    <div className="macos-window">
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
          <form action={loginAction} className="auth-form auth-form-grid">
            <p className="macos-lead">
              Sign in to open your dashboard. If you have not set a password yet, use your email and
              mobile number.
            </p>

            <AuthField label="Email address" icon={<Mail size={15} aria-hidden />}>
              <input name="email" type="email" autoComplete="email" placeholder="name@mail.com" required />
            </AuthField>

            <AuthField label="Password or mobile number" icon={<Lock size={15} aria-hidden />}>
              <input
                name="password"
                type="text"
                autoComplete="current-password"
                placeholder="Password or 917 123 4567"
                required
              />
            </AuthField>

            <div className="auth-row">
              <label className="auth-check">
                <input type="checkbox" name="remember" />
                Remember me
              </label>
              <Link href="/contact" className="auth-forgot">
                Forgot password?
              </Link>
            </div>

            {loginState.error ? <p className="auth-error">{loginState.error}</p> : null}

            <div className="macos-actions">
              <p className="auth-switch-copy">
                Not a member yet?{" "}
                <Link href="/register" className="auth-forgot">
                  Register
                </Link>
              </p>
              <button type="submit" className="macos-btn macos-btn-primary" disabled={loginPending}>
                {loginPending ? "Signing In..." : "Sign In"}
              </button>
            </div>
          </form>
        ) : (
          <form action={registerAction} className="auth-form auth-form-grid">
            <p className="macos-lead">
              Register with your name, email, mobile number, and company. You can open the dashboard
              right away. Your account stays pending until you finish your profile and our team
              verifies your registration and payment.
            </p>

            <AuthField label="Full name" icon={<UserRound size={15} aria-hidden />}>
              <input name="name" autoComplete="name" placeholder="Juan Dela Cruz" required />
            </AuthField>
            <AuthField label="Email address" icon={<Mail size={15} aria-hidden />}>
              <input name="email" type="email" autoComplete="email" placeholder="name@mail.com" required />
            </AuthField>
            <AuthField label="Phone number" className="auth-span-2" icon={<Smartphone size={15} aria-hidden />}>
              <PhoneField />
            </AuthField>
            <AuthField label="Company" className="auth-span-2" icon={<Building2 size={15} aria-hidden />}>
              <input name="company" autoComplete="organization" placeholder="Your company" required />
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
